import { UserStatusType } from '@aws-sdk/client-cognito-identity-provider';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AuthStatus } from '../models/auth-status.enum';

export class SignupResponseDto {
  @IsEnum(AuthStatus)
  status: AuthStatus;

  @IsString()
  @IsOptional()
  message?: string;

  @IsEnum(UserStatusType)
  userVerificationStatus: UserStatusType;
}
