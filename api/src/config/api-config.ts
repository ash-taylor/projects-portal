import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
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
}
