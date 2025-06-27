import * as path from 'node:path';
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { EndpointType, LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
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
import { SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Code, Function as LambdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

const solutionRootDir = `${__dirname}/../../../`;

export interface BackendStackProps extends StackProps {
  vpc: Vpc;
  lambdaSecurityGroup: SecurityGroup;
}

export class BackendStack extends Stack {
  public readonly api: LambdaRestApi;
  public readonly apiHandler: LambdaFunction;
  public readonly apiDomain: string;
  public readonly apiAppClientSecret: Secret;
  public readonly cognitoUserPool: UserPool;
  public readonly cognitoUserPoolClient: UserPoolClient;
  public readonly userPoolId: string;
  public readonly userPoolClientId: string;
  public readonly appClientSecretName: string;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, {
      ...props,
      description: 'Contains backend API GW, API Handler and Cognito Resources',
    });

    this.appClientSecretName = 'projects-portal-api-client-secret';

    // BACKEND - API
    this.apiHandler = new LambdaFunction(this, 'api-handler', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: Code.fromAsset(path.join(solutionRootDir, 'api/dist')),
      timeout: Duration.seconds(30),
      vpc: props.vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [props.lambdaSecurityGroup],
      ipv6AllowedForDualStack: true,
    });

    this.api = new LambdaRestApi(this, 'projects-portal-api', {
      restApiName: 'Projects Portal API',
      handler: this.apiHandler,
      proxy: true,
      endpointConfiguration: {
        types: [EndpointType.REGIONAL],
      },
    });

    this.apiDomain = `${this.api.restApiId.toString()}.execute-api.${this.region}.amazonaws.com`;

    // AUTH - Cognito
    this.cognitoUserPool = new UserPool(this, 'projects-portal-user-pool', {
      userPoolName: 'projects-portal-user-pool',
      featurePlan: FeaturePlan.ESSENTIALS,
      signInCaseSensitive: false,
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: 'Verify your email!',
        emailBody:
          '<h1>Welcome to the Projects Portal</h1><br><p>Thanks for signing up to the Projects Portal Application! <br>Your verification code is {####}',
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
      userPool: this.cognitoUserPool,
      description: 'Projects Portal Admin Group',
      groupName: 'admin',
      precedence: 0,
    });

    new UserPoolGroup(this, 'projects-portal-user-group', {
      userPool: this.cognitoUserPool,
      description: 'Projects Portal User Group',
      groupName: 'user',
      precedence: 1,
    });

    this.cognitoUserPoolClient = new UserPoolClient(this, 'projects-portal-api-client', {
      userPool: this.cognitoUserPool,
      userPoolClientName: 'projects-portal-api-client',
      accessTokenValidity: Duration.minutes(5),
      idTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(30),
      enableTokenRevocation: true,
      generateSecret: true,
      preventUserExistenceErrors: true,
    });

    const cfnApiAppClient = this.cognitoUserPoolClient.node.defaultChild as CfnUserPoolClient;
    cfnApiAppClient.refreshTokenRotation = { feature: 'ENABLED', retryGracePeriodSeconds: 30 };
    cfnApiAppClient.explicitAuthFlows = [
      'ALLOW_ADMIN_USER_PASSWORD_AUTH',
      'ALLOW_USER_PASSWORD_AUTH',
      'ALLOW_USER_AUTH',
    ];

    this.apiHandler.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'cognito-idp:AdminInitiateAuth',
          'cognito-idp:AdminGetUser',
          'cognito-idp:AdminAddUserToGroup',
          'cognito-idp:AdminDeleteUser',
          'cognito-idp:AdminUpdateUserAttributes',
          'cognito-idp:ConfirmSignUp',
          'cognito-idp:SignUp',
          'cognito-idp:RevokeToken',
        ],
        resources: [this.cognitoUserPool.userPoolArn],
      }),
    );

    this.apiAppClientSecret = new Secret(this, 'projects-portal-api-client-secret', {
      secretName: this.appClientSecretName,
      secretStringValue: this.cognitoUserPoolClient.userPoolClientSecret,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    this.apiAppClientSecret.grantRead(this.apiHandler.role!);

    this.userPoolId = this.cognitoUserPool.userPoolId;
    this.userPoolClientId = this.cognitoUserPoolClient.userPoolClientId;
  }
}
