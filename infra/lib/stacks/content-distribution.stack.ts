import * as path from 'node:path';
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
  AccessLevel,
  AllowedMethods,
  Function as CFFunction,
  CachePolicy,
  Distribution,
  FunctionCode,
  FunctionEventType,
  HeadersFrameOption,
  HeadersReferrerPolicy,
  OriginRequestPolicy,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { HttpOrigin, S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { CfnWebACL } from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

const solutionRootDir = `${__dirname}/../../../`;

export interface ContentDistributionStackProps extends StackProps {
  apiDomain: string;
}

export class ContentDistributionStack extends Stack {
  public readonly cloudfrontDistribution: Distribution;

  constructor(scope: Construct, id: string, props: ContentDistributionStackProps) {
    super(scope, id, {
      ...props,
      description: 'Contains the UI Deployment and Cloudfront Distribution',
    });

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

    const apiOrigin = new HttpOrigin(props.apiDomain, { originPath: '/prod' });

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

    const cfnWebACL = new CfnWebACL(this, 'projects-portal-web-acl', {
      defaultAction: {
        allow: {},
      },
      scope: 'CLOUDFRONT',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'projects-portal-web-acl',
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: 'ProjectsPortalWebAclCRS',
          priority: 0,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'projects-portal-web-acl-crs',
            sampledRequestsEnabled: true,
          },
          overrideAction: {
            none: {},
          },
        },
        {
          name: 'ProjectsPortalWebAclKnownBadInputs',
          priority: 1,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet', // AWS Common rules, see - https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-baseline.html
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'projects-portal-web-acl-kbi', // AWS Known bad inputs protection
            sampledRequestsEnabled: true,
          },
          overrideAction: {
            none: {},
          },
        },
        {
          name: 'ProjectsPortalWebAclSQLi',
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet', // AWS SQL Injection protection, see - https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-use-case.html
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'projects-portal-web-acl-sqli',
            sampledRequestsEnabled: true,
          },
          overrideAction: {
            none: {},
          },
        },
      ],
    });

    this.cloudfrontDistribution = new Distribution(this, 'projects-portal-web-app-distribution', {
      defaultBehavior: {
        origin: s3Origin,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
        responseHeadersPolicy: uiResponseHeadersPolicy,
        functionAssociations: [
          {
            function: new CFFunction(this, 's3ViewerRequestFn', {
              functionName: 's3-viewer-request',
              code: FunctionCode.fromFile({
                filePath: path.join(solutionRootDir, 'infra/lib/lambdas/cloudfront/s3-viewer-req-fn.js'),
              }),
            }),
            eventType: FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      defaultRootObject: 'index.html',
      webAclId: cfnWebACL.attrArn,
    });

    this.cloudfrontDistribution.addBehavior('/api/*', apiOrigin, {
      allowedMethods: AllowedMethods.ALLOW_ALL,
      cachePolicy: CachePolicy.CACHING_DISABLED,
      originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      responseHeadersPolicy: apiResponseHeadersPolicy,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    });

    new BucketDeployment(this, 'projects-portal-ui-deployment', {
      sources: [Source.bucket(source.bucket, source.s3ObjectKey)],
      destinationBucket: websiteBucket,
      distribution: this.cloudfrontDistribution,
    });
  }
}
