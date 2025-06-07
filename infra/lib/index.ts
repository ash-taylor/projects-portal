#!/usr/bin/env node
import { App, Stage, Tags } from 'aws-cdk-lib';
import { BackendStack } from './stacks/backend.stack';
import { ContentDistributionStack } from './stacks/content-distribution.stack';
import { DeploymentStack } from './stacks/deployment.stack';

const MAIN_REGION = 'eu-west-2';
const CLOUDFRONT_REGION = 'us-east-1';

const app = new App();

const devStage = new Stage(app, 'Projects-Portal', {});

const stages = [devStage];

function createStageInfra(stage: Stage) {
  Tags.of(stage).add('application', 'projects-portal');
  Tags.of(stage).add('stage', stage.stageName);

  const { apiHandler, apiDomain, cognitoUserPool, cognitoUserPoolClient, apiAppClientSecret } = new BackendStack(
    stage,
    'ProjectsPortalBackendStack',
    { env: { region: MAIN_REGION }, crossRegionReferences: true },
  );

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
