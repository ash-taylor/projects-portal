import { Stack, StackProps } from 'aws-cdk-lib';
import {
  InterfaceVpcEndpointAwsService,
  IpAddresses,
  IpProtocol,
  Ipv6Addresses,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkStackProps extends StackProps {}

export class NetworkStack extends Stack {
  public readonly vpc: Vpc;
  public readonly lambdaSecurityGroup: SecurityGroup;
  public readonly rdsSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, {
      ...props,
      description: 'Contains the VPC for the application',
    });

    this.vpc = new Vpc(this, 'projects-portal-vpc', {
      vpcName: 'ProjectsPortalVPC',
      ipProtocol: IpProtocol.DUAL_STACK,
      ipAddresses: IpAddresses.cidr('10.0.0.0/24'),
      ipv6Addresses: Ipv6Addresses.amazonProvided(),
      natGateways: 0, // Attempting to use IPV6 only for cost savings
      maxAzs: 2, // Min 2 for RDS
      vpnGateway: false,
      subnetConfiguration: [
        {
          name: 'Projects-Portal-Lambda-SN',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
          ipv6AssignAddressOnCreation: true,
        },
        {
          name: 'Projects-Portal-RDS-SN-A',
          subnetType: SubnetType.PRIVATE_ISOLATED,
          ipv6AssignAddressOnCreation: false,
        },
        {
          name: 'Projects-Portal-RDS-SN-B',
          subnetType: SubnetType.PRIVATE_ISOLATED,
          ipv6AssignAddressOnCreation: false,
        },
      ],
    });

    this.vpc.addInterfaceEndpoint('ProjectsPortalSecretsManagerEndpoint', {
      service: InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });

    this.lambdaSecurityGroup = new SecurityGroup(this, 'projects-portal-apiHandler-sg', {
      description: 'Projects Portal API Lambda SG for RDS connection',
      securityGroupName: 'projects-portal-apiHandler-sg',
      allowAllOutbound: true,
      allowAllIpv6Outbound: true,
      vpc: this.vpc,
    });

    this.rdsSecurityGroup = new SecurityGroup(this, 'projects-portal-rds-sg', {
      description: 'Projects Portal RDS Security Group',
      securityGroupName: 'Projects-Portal-RDS-SG',
      allowAllOutbound: false,
      vpc: this.vpc,
    });

    this.rdsSecurityGroup.addIngressRule(this.lambdaSecurityGroup, Port.tcp(5432));
  }
}
