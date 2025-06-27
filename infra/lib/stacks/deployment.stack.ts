import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Function as LambdaFunction } from 'aws-cdk-lib/aws-lambda';
import { DatabaseInstance } from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';
import { InitRdsDatabase } from '../constructs/init-rds-database/init-rds-database.cr';
import { SetApiLambdaEnvironment } from '../constructs/set-api-lambda-environment/set-api-lambda-environment.cr';

export type ApiHandlerEnv = {
  API_PREFIX: string;
  UI_DOMAIN: string;
  COGNITO_USER_POOL_ID: string;
  COGNITO_CLIENT_ID: string;
  COGNITO_CLIENT_SECRET_NAME: string;
  RDS_SECRET_ID: string;
  ENVIRONMENT: string;
  NODE_ENV: string;
};

export interface DeploymentStackProps extends StackProps {
  apiHandlerLambda: LambdaFunction;
  rdsInstance: DatabaseInstance;
  vpc: Vpc;
  lambdaSecurityGroup: SecurityGroup;
  cloudFrontDistributionDomain: string;
  cognitoUserPoolId: string;
  cognitoUserPoolClientId: string;
  cognitoUserPoolClientSecretId: string;
  userPoolId: string;
  userPoolClientId: string;
  appClientSecretName: string;
}

export class DeploymentStack extends Stack {
  constructor(scope: Construct, id: string, props: DeploymentStackProps) {
    super(scope, id, {
      ...props,
      description: 'Contains required deployment parameters for API environment',
    });

    // Add API Lambda env variables here
    const API_HANDLER_ENV: ApiHandlerEnv = {
      API_PREFIX: 'api',
      UI_DOMAIN: `https://${props.cloudFrontDistributionDomain}`,
      COGNITO_USER_POOL_ID: props.cognitoUserPoolId,
      COGNITO_CLIENT_ID: props.cognitoUserPoolClientId,
      COGNITO_CLIENT_SECRET_NAME: props.cognitoUserPoolClientSecretId,
      RDS_SECRET_ID: props.rdsInstance.secret!.secretName,
      ENVIRONMENT: 'production',
      NODE_ENV: 'production',
    };

    props.rdsInstance.secret!.grantRead(props.apiHandlerLambda.role!);

    new SetApiLambdaEnvironment(this, 'set-api-lambda-env', {
      apiHandlerLambda: props.apiHandlerLambda,
      environment: API_HANDLER_ENV,
    });

    new InitRdsDatabase(this, 'init-rds-database', {
      rdsInstanceSecret: props.rdsInstance.secret!,
      vpc: props.vpc,
      lambdaSecurityGroup: props.lambdaSecurityGroup,
    });

    new CfnOutput(this, 'projects-portal-user-pool-id', {
      key: 'UserPoolId',
      value: props.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new CfnOutput(this, 'projects-portal-app-client-id', {
      key: 'AppClientId',
      value: props.userPoolClientId,
      description: 'App client id for the projects portal user pool',
    });

    new CfnOutput(this, 'projects-portal-api-client-secret-name', {
      key: 'AppClientSecretName',
      value: props.appClientSecretName,
      description: 'Name of the App Client secret',
    });

    new CfnOutput(this, 'projects-portal-distribution-domain', {
      key: 'DistributionDomain',
      value: props.cloudFrontDistributionDomain,
      description: 'URL of the UI Cloudfront Distribution',
    });
  }
}
