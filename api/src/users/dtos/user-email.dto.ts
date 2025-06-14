import { IsEmail, IsOptional } from 'class-validator';

export class UserEmailDto {
  @IsEmail()
  @IsOptional()
  email?: string;
}
