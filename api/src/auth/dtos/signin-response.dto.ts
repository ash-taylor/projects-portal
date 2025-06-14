import { IsEmail, IsOptional, IsString } from 'class-validator';

export class SigninResponseDto {
  @IsString()
  sub!: string;

  @IsEmail()
  email!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  project?: string;
}
