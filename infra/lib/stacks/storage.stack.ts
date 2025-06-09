import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { InstanceClass, InstanceSize, InstanceType, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import {
  CaCertificate,
  DatabaseInstance,
  DatabaseInstanceEngine,
  NetworkType,
  PerformanceInsightRetention,
  PostgresEngineVersion,
  StorageType,
} from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export interface StorageStackProps extends StackProps {
  vpc: Vpc;
  rdsSecurityGroup: SecurityGroup;
}

export class StorageStack extends Stack {
  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, {
      ...props,
      description: 'Contains the RDS Database',
    });

    new DatabaseInstance(this, 'projects-portal-database', {
      databaseName: 'ProjectsPortal',
      engine: DatabaseInstanceEngine.postgres({ version: PostgresEngineVersion.VER_17_5 }),
      autoMinorVersionUpgrade: true,
      instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MICRO),
      storageType: StorageType.GP2,
      allocatedStorage: 20,
      maxAllocatedStorage: 1000,
      networkType: NetworkType.IPV4,
      vpc: props.vpc,
      securityGroups: [props.rdsSecurityGroup],
      vpcSubnets: { subnets: props.vpc.isolatedSubnets },
      publiclyAccessible: false,
      caCertificate: CaCertificate.RDS_CA_RSA2048_G1,
      performanceInsightRetention: PerformanceInsightRetention.DEFAULT,
      enablePerformanceInsights: true,
      removalPolicy: RemovalPolicy.DESTROY, // Update this
    });
  }
}
