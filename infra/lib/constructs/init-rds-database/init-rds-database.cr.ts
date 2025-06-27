import * as path from 'node:path';
import { CustomResource, Duration } from 'aws-cdk-lib';
import { SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { InitRdsDBHandlerProps } from './init-rds-database-handler.props';

const solutionRootDir = `${__dirname}/../../../../`;

export interface InitRdsDatabaseProps {
  rdsInstanceSecret: ISecret;
  vpc: Vpc;
  lambdaSecurityGroup: SecurityGroup;
}

export class InitRdsDatabase extends Construct {
  constructor(scope: Construct, id: string, props: InitRdsDatabaseProps) {
    super(scope, id);

    const onEventHandler = new NodejsFunction(this, 'init-rds-db-handler', {
      description: 'Initializes the RDS database',
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(solutionRootDir, 'infra/lib/lambdas/init-rds-database/init-rds-db-lambda.ts'),
      handler: 'index.handler',
      bundling: {
        minify: true,
        sourceMap: false,
        externalModules: ['aws-sdk'],
      },
      timeout: Duration.minutes(2),
      vpc: props.vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [props.lambdaSecurityGroup],
    }).currentVersion;

    props.rdsInstanceSecret.grantRead(onEventHandler.role!);

    const provider = new Provider(this, 'init-rds-db-provider', {
      onEventHandler,
    });

    const properties: InitRdsDBHandlerProps & { runEnforcer: number } = {
      runEnforcer: Date.now(), // Ensures trigger on every deploy
      secretId: props.rdsInstanceSecret.secretName,
    };

    new CustomResource(this, 'init-rds-db-resource', {
      resourceType: 'Custom::Init-RDS-DB',
      serviceToken: provider.serviceToken,
      properties,
    });
  }
}
