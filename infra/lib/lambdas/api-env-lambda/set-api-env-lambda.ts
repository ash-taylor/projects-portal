import { LambdaClient, UpdateFunctionConfigurationCommand } from '@aws-sdk/client-lambda';
import { CloudFormationCustomResourceEvent } from 'aws-lambda';
import { SetApiLambdaEnvironmentHandlerProps } from '../../constructs/set-api-lambda-environment/set-api-lambda-environment-handler.props';

const client = new LambdaClient({});

export async function handler(event: CloudFormationCustomResourceEvent) {
  const props = event.ResourceProperties as unknown as SetApiLambdaEnvironmentHandlerProps;

  switch (event.RequestType) {
    case 'Create':
    case 'Update':
      await updateEnvironment(props);
      break;
    default:
      break;
  }
}

async function updateEnvironment(props: SetApiLambdaEnvironmentHandlerProps) {
  return await client.send(
    new UpdateFunctionConfigurationCommand({
      FunctionName: props.functionName,
      Environment: { Variables: props.environment },
    }),
  );
}
