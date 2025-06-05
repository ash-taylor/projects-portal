import * as path from 'node:path';
import { Duration, RemovalPolicy, Stack, StackProps, Stage, StageProps } from 'aws-cdk-lib';
import { EndpointType, LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import {
  AccessLevel,
  AllowedMethods,
  CachePolicy,
  Distribution,
  HeadersFrameOption,
  HeadersReferrerPolicy,
  OriginRequestCookieBehavior,
  OriginRequestHeaderBehavior,
  OriginRequestPolicy,
  OriginRequestQueryStringBehavior,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { HttpOrigin, S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import {
  AccountRecovery,
  CfnUserPoolClient,
  FeaturePlan,
  Mfa,
  UserPool,
  UserPoolClient,
  UserPoolGroup,
  VerificationEmailStyle,
} from 'aws-cdk-lib/aws-cognito';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Code, Function as LambdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

const solutionRootDir = `${__dirname}/../../`;

export class ProjectsPortalStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    new ProjectsPortalStack(this, 'ProjectsPortalStack', {
      stackName: `${id}-projects-portal`,
      description: 'Test infra stack',
    });
  }
}

export class ProjectsPortalStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // BACKEND - API
    const apiHandler = new LambdaFunction(this, 'api-handler', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: Code.fromAsset(path.join(solutionRootDir, 'api/dist')),
      timeout: Duration.seconds(30),
    });

    const api = new LambdaRestApi(this, 'projects-portal-api', {
      restApiName: 'Projects Portal API',
      handler: apiHandler,
      proxy: true,
      endpointConfiguration: {
        types: [EndpointType.REGIONAL],
      },
    });

    const apiDomain = `${api.restApiId}.execute-api.${this.region}.amazonaws.com`;

    // WEBSITE
    const websiteBucket = new Bucket(this, 'projects-portal-website-bucket', {
      bucketName: 'projects-portal-web-app',
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const source = new Asset(this, 'UIAsset', {
      path: path.join(solutionRootDir, 'ui/dist'),
    });

    const s3Origin = S3BucketOrigin.withOriginAccessControl(websiteBucket, {
      originAccessLevels: [AccessLevel.READ, AccessLevel.LIST],
    });

    const apiOrigin = new HttpOrigin(apiDomain, { originPath: '/prod' });

    const uiResponseHeadersPolicy = new ResponseHeadersPolicy(this, 'UIResponseHeadersPolicy', {
      responseHeadersPolicyName: 'ProjectsPortalUISecurityHeadersPolicy',
      securityHeadersBehavior: {
        contentSecurityPolicy: {
          contentSecurityPolicy:
            "default-src 'self'; font-src 'self' data:; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none'; connect-src 'self'",
          override: true,
        },
        strictTransportSecurity: {
          accessControlMaxAge: Duration.days(365),
          includeSubdomains: true,
          override: true,
        },
        contentTypeOptions: {
          override: true,
        },
        frameOptions: {
          frameOption: HeadersFrameOption.DENY,
          override: true,
        },
        referrerPolicy: {
          referrerPolicy: HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          override: true,
        },
        xssProtection: {
          protection: true,
          modeBlock: true,
          override: true,
        },
      },
      customHeadersBehavior: {
        customHeaders: [
          {
            header: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
            override: true,
          },
        ],
      },
      removeHeaders: ['server'],
    });

    const apiOriginRequestPolicy = new OriginRequestPolicy(this, 'ApiOriginRequestPolicy', {
      originRequestPolicyName: 'ProjectsPortalApiOriginRequestPolicy',
      queryStringBehavior: OriginRequestQueryStringBehavior.all(),
      headerBehavior: OriginRequestHeaderBehavior.denyList('host'),
      cookieBehavior: OriginRequestCookieBehavior.all(),
    });

    const apiResponseHeadersPolicy = new ResponseHeadersPolicy(this, 'ApiResponseHeadersPolicy', {
      responseHeadersPolicyName: 'ProjectsPortalApiHeadersPolicy',
      securityHeadersBehavior: {
        strictTransportSecurity: {
          accessControlMaxAge: Duration.days(365),
          includeSubdomains: true,
          override: true,
        },
        contentTypeOptions: {
          override: true,
        },
        referrerPolicy: {
          referrerPolicy: HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          override: true,
        },
      },
      removeHeaders: ['server'],
    });

    // static website cloudfront distribution
    const cloudfrontDistribution = new Distribution(this, 'projects-portal-web-app-distribution', {
      defaultBehavior: {
        origin: s3Origin,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
        responseHeadersPolicy: uiResponseHeadersPolicy,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responsePagePath: '/index.html',
          responseHttpStatus: 200,
        },
        {
          httpStatus: 404,
          responsePagePath: '/index.html',
          responseHttpStatus: 200,
        },
      ],
    });
    cloudfrontDistribution.addBehavior('/api/*', apiOrigin, {
      allowedMethods: AllowedMethods.ALLOW_ALL,
      cachePolicy: CachePolicy.CACHING_DISABLED,
      originRequestPolicy: apiOriginRequestPolicy,
      responseHeadersPolicy: apiResponseHeadersPolicy,
    });

    new BucketDeployment(this, 'projects-portal-ui-deployment', {
      sources: [Source.bucket(source.bucket, source.s3ObjectKey)],
      destinationBucket: websiteBucket,
      distribution: cloudfrontDistribution,
    });

    // AUTH - Cognito
    const cognitoUserPool = new UserPool(this, 'projects-portal-user-pool', {
      userPoolName: 'projects-portal-user-pool',
      featurePlan: FeaturePlan.ESSENTIALS,
      signInCaseSensitive: false,
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: 'Verify your email!',
        emailBody: 'Thanks for signing up to the Projects Assignment Portal! Your verification code is {####}',
        emailStyle: VerificationEmailStyle.CODE,
      },
      signInAliases: { email: true },
      signInPolicy: { allowedFirstAuthFactors: { password: true } },
      autoVerify: { email: true },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      mfa: Mfa.OFF,
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      standardAttributes: {
        email: { required: true, mutable: true },
        familyName: { required: true, mutable: true },
        givenName: { required: true, mutable: true },
        middleName: { required: false, mutable: true },
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    new UserPoolGroup(this, 'projects-portal-admin-group', {
      userPool: cognitoUserPool,
      description: 'Projects Portal Admin Group',
      groupName: 'admin',
      precedence: 0,
    });

    new UserPoolGroup(this, 'projects-portal-user-group', {
      userPool: cognitoUserPool,
      description: 'Projects Portal User Group',
      groupName: 'user',
      precedence: 1,
    });

    const apiAppClient = new UserPoolClient(this, 'projects-portal-api-client', {
      userPool: cognitoUserPool,
      userPoolClientName: 'projects-portal-api-client',
      accessTokenValidity: Duration.minutes(5),
      idTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(30),
      enableTokenRevocation: true,
      generateSecret: true,
      preventUserExistenceErrors: true,
    });

    const cfnApiAppClient = apiAppClient.node.defaultChild as CfnUserPoolClient;
    cfnApiAppClient.refreshTokenRotation = { feature: 'ENABLED', retryGracePeriodSeconds: 30 };
    cfnApiAppClient.explicitAuthFlows = ['ALLOW_ADMIN_USER_PASSWORD_AUTH', 'ALLOW_USER_PASSWORD_AUTH'];

    apiHandler.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'cognito-idp:AdminInitiateAuth',
          'cognito-idp:AdminRespondToAuthChallenge',
          'cognito-idp:AdminCreateUser',
          'cognito-idp:AdminGetUser',
          'cognito-idp:AdminUpdateUserAttributes',
          'cognito-idp:AdminConfirmSignUp',
          'cognito-idp:SignUp',
          'cognito-idp:InitiateAuth',
          'cognito-idp:RespondToAuthChallenge',
        ],
        resources: [cognitoUserPool.userPoolArn],
      }),
    );

    const apiAppClientSecret = new Secret(this, 'projects-portal-api-client-secret', {
      secretName: 'projects-portal-api-client-secret',
      secretStringValue: apiAppClient.userPoolClientSecret,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    apiAppClientSecret.grantRead(apiHandler.role!);

    // Configure NESTJS API Lambda Environment Variables
    const apiHandlerEnvVariables = {
      API_PREFIX: 'api',
      UI_DOMAIN: `https://${cloudfrontDistribution.distributionDomainName}`,
      COGNITO_USER_POOL_ID: cognitoUserPool.userPoolId,
      COGNITO_CLIENT_ID: apiAppClient.userPoolClientId,
      COGNITO_CLIENT_SECRET_NAME: apiAppClientSecret.secretName,
    };
    Object.entries(apiHandlerEnvVariables).forEach(([key, value]) => apiHandler.addEnvironment(key, value));

    // Export the API URL for reference
    this.exportValue(cloudfrontDistribution.distributionDomainName, {
      name: 'UICloudfrontDistribution',
      description: 'URL of the UI Cloudfront Distribution',
    });
  }
}
