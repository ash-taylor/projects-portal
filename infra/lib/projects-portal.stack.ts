import * as path from 'node:path';
import { Duration, Stack, StackProps, Stage, StageProps } from 'aws-cdk-lib';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { AccessLevel, Distribution } from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Code, Function as LambdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
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

    const websiteBucket = new Bucket(this, 'projects-portal-website-bucket', {
      bucketName: 'projects-portal-web-app',
    });

    const source = new Asset(this, 'UIAsset', {
      path: path.join(solutionRootDir, 'ui/dist'),
    });

    const s3Origin = S3BucketOrigin.withOriginAccessControl(websiteBucket, {
      originAccessLevels: [AccessLevel.READ, AccessLevel.LIST],
    });

    // static website cloudfront distribution
    const uiDistribution = new Distribution(this, 'projects-portal-web-app-distribution', {
      defaultBehavior: {
        origin: s3Origin,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responsePagePath: '/index.html',
          responseHttpStatus: 200,
        },
      ],
    });

    const apiHandler = new LambdaFunction(this, 'api-handler', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: Code.fromAsset(path.join(solutionRootDir, 'api/dist')),
      timeout: Duration.seconds(30),
      environment: {
        UI_DOMAIN: `https://${uiDistribution.distributionDomainName}`,
      },
    });

    const api = new LambdaRestApi(this, 'projects-portal-api', {
      restApiName: 'Projects Portal API',
      handler: apiHandler,
      proxy: true,
      defaultCorsPreflightOptions: {
        allowOrigins: [
          `https://${uiDistribution.distributionDomainName}`,
          'http://localhost:3000', // For local development
        ],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowHeaders: ['Content-Type', 'Authorization'],
        allowCredentials: true,
      },
    });

    // Add the API URL to the S3 bucket as a config file
    new BucketDeployment(this, 'projects-portal-ui-deployment', {
      sources: [
        Source.bucket(source.bucket, source.s3ObjectKey),
        Source.jsonData('config.json', {
          apiUrl: `${api.url}api`,
        }),
      ],
      destinationBucket: websiteBucket,
      distribution: uiDistribution,
    });

    // Export the API URL for reference
    this.exportValue(api.url, {
      name: 'ProjectsPortalApiUrl',
      description: 'URL of the Projects Portal API',
    });

    this.exportValue(uiDistribution.distributionDomainName, {
      name: 'UICloudfrontDistribution',
      description: 'URL of the UI Cloudfront Distribution',
    });
  }
}
