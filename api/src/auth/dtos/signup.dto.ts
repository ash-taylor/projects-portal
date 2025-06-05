import { IsBoolean, IsDefined, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail()
  @IsNotEmpty()
  @IsDefined()
  email!: string;

  @IsString()
  @MinLength(8)
  @IsDefined()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsDefined()
  @IsNotEmpty()
  lastName!: string;

  @IsBoolean()
  @IsOptional()
  admin = false;
}
