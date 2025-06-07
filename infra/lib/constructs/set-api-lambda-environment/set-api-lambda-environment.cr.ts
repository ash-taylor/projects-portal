import * as path from 'node:path';
import { CustomResource, Duration } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Function as LambdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { SetApiLambdaEnvironmentHandlerProps } from './set-api-lambda-environment-handler.props';

const solutionRootDir = `${__dirname}/../../../../`;

export interface SetApiLambdaEnvironmentProps {
  apiHandlerLambda: LambdaFunction;
  environment: { [key: string]: string };
}

export class SetApiLambdaEnvironment extends Construct {
  constructor(scope: Construct, id: string, props: SetApiLambdaEnvironmentProps) {
    super(scope, id);

    const onEventHandler = new NodejsFunction(this, 'set-lambda-env-handler', {
      description: 'Sets the environment variables for the API Lambda function',
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(solutionRootDir, 'infra/lib/lambdas/api-env-lambda/set-api-env-lambda.ts'),
      handler: 'index.handler',
      bundling: {
        minify: true,
        sourceMap: false,
        externalModules: ['aws-sdk'],
      },
      timeout: Duration.minutes(2),
    }).currentVersion;

    onEventHandler.addToRolePolicy(
      new PolicyStatement({
        actions: ['lambda:GetFunctionConfiguration', 'lambda:UpdateFunctionConfiguration'],
        resources: [props.apiHandlerLambda.functionArn],
      }),
    );

    const provider = new Provider(this, 'set-lambda-env-provider', {
      onEventHandler,
    });

    const properties: SetApiLambdaEnvironmentHandlerProps & { runEnforcer: number } = {
      runEnforcer: Date.now(),
      functionName: props.apiHandlerLambda.functionName,
      environment: props.environment,
    };

    new CustomResource(this, 'set-lambda-env-resource', {
      resourceType: 'Custom::Set-Lambda-Environment',
      serviceToken: provider.serviceToken,
      properties,
    });
  }
}
