import { Expose } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiHandlerConfig } from './api-handler-config';

export class ApiConfig implements ApiHandlerConfig {
  @IsString()
  @Expose({ name: 'AWS_REGION' })
  awsRegion!: string;

  @IsString()
  @Expose({ name: 'API_PREFIX' })
  apiPrefix!: string;

  @IsString()
  @Expose({ name: 'COGNITO_CLIENT_ID' })
  cognitoClientId!: string;

  @IsString()
  @Expose({ name: 'COGNITO_USER_POOL_ID' })
  cognitoUserPoolId!: string;

  @IsString()
  @Expose({ name: 'COGNITO_CLIENT_SECRET_NAME' })
  cognitoClientSecretName!: string;

  @IsString()
  @Expose({ name: 'UI_DOMAIN' })
  uiDomain!: string;

  @IsString()
  @Expose({ name: 'ENVIRONMENT' })
  environment!: string;

  @IsString()
  @IsOptional()
  @Expose({ name: 'DB_HOST' })
  dbHost?: string;

  @IsNumber()
  @IsOptional()
  @Expose({ name: 'DB_PORT' })
  dbPort?: number;

  @IsString()
  @IsOptional()
  @Expose({ name: 'DB_USERNAME' })
  dbUser?: string;

  @IsString()
  @IsOptional()
  @Expose({ name: 'DB_PASSWORD' })
  dbPassword?: string;

  @IsString()
  @IsOptional()
  @Expose({ name: 'DB_NAME' })
  dbName?: string;

  @IsString()
  @IsOptional()
  @Expose({ name: 'RDS_SECRET_ID' })
  rdsSecretId?: string;
}
