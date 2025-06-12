export interface ApiHandlerConfig {
  awsRegion: string;
  apiPrefix: string;
  cognitoClientId: string;
  cognitoUserPoolId: string;
  cognitoClientSecretName: string;
  uiDomain: string;
  environment: string;
  dbHost?: string;
  dbPort?: number;
  dbUser?: string;
  dbPassword?: string;
  dbName?: string;
  rdsSecretId?: string;
}
