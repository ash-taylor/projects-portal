#!/usr/bin/env node
import { App, Stack, Stage, Tags } from 'aws-cdk-lib';
import { BackendStack } from './stacks/backend.stack';
import { ContentDistributionStack } from './stacks/content-distribution.stack';
import { DeploymentStack } from './stacks/deployment.stack';
import { NetworkStack } from './stacks/network.stack';
import { StorageStack } from './stacks/storage.stack';

const MAIN_REGION = 'eu-west-2';
const CLOUDFRONT_REGION = 'us-east-1';

const app = new App();

const devStage = new Stage(app, 'Projects-Portal', {});

const stages = [devStage];

function createStageInfra(stage: Stage) {
  Tags.of(stage).add('application', 'projects-portal');
  Tags.of(stage).add('stage', stage.stageName);

  const { lambdaSecurityGroup, rdsSecurityGroup, vpc } = new NetworkStack(stage, 'ProjectsPortalNetworkStack', {
    env: { region: MAIN_REGION },
  });

  const { apiHandler, apiDomain, cognitoUserPool, cognitoUserPoolClient, apiAppClientSecret } = new BackendStack(
    stage,
    'ProjectsPortalBackendStack',
    {
      env: { region: MAIN_REGION },
      crossRegionReferences: true,
      vpc,
      lambdaSecurityGroup,
    },
  );

  const storageStack = new StorageStack(stage, 'ProjectsPortalStorageStack', {
    env: { region: MAIN_REGION },
    vpc,
    rdsSecurityGroup,
  });

  storageStack.addDependency(Stack.of(vpc));

  const { cloudfrontDistribution } = new ContentDistributionStack(stage, 'ProjectsPortalContentDistributionStack', {
    apiDomain: apiDomain,
    env: { region: CLOUDFRONT_REGION },
    crossRegionReferences: true,
  });

  new DeploymentStack(stage, 'ProjectsPortalDeploymentStack', {
    cloudFrontDistributionDomain: cloudfrontDistribution.domainName,
    cognitoUserPoolId: cognitoUserPool.userPoolId,
    cognitoUserPoolClientId: cognitoUserPoolClient.userPoolClientId,
    cognitoUserPoolClientSecretId: apiAppClientSecret.secretArn,
    apiHandlerLambda: apiHandler,
    env: { region: MAIN_REGION },
    crossRegionReferences: true,
  });
}

stages.forEach((stage) => createStageInfra(stage));

app.synth();
