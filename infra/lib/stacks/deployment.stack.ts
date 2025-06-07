import { Stack, StackProps } from 'aws-cdk-lib';
import { Function as LambdaFunction } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { SetApiLambdaEnvironment } from '../constructs/set-api-lambda-environment/set-api-lambda-environment.cr';

export interface DeploymentStackProps extends StackProps {
  apiHandlerLambda: LambdaFunction;
  cloudFrontDistributionDomain: string;
  cognitoUserPoolId: string;
  cognitoUserPoolClientId: string;
  cognitoUserPoolClientSecretId: string;
}

export class DeploymentStack extends Stack {
  constructor(scope: Construct, id: string, props: DeploymentStackProps) {
    super(scope, id, {
      ...props,
      description: 'Contains required deployment parameters for API environment',
    });

    new SetApiLambdaEnvironment(this, 'set-api-lambda-env', {
      apiHandlerLambda: props.apiHandlerLambda,
      environment: {
        API_PREFIX: 'api',
        UI_DOMAIN: `https://${props.cloudFrontDistributionDomain}`,
        COGNITO_USER_POOL_ID: props.cognitoUserPoolId,
        COGNITO_CLIENT_ID: props.cognitoUserPoolClientId,
        COGNITO_CLIENT_SECRET_NAME: props.cognitoUserPoolClientSecretId,
      },
    });
  }
}
