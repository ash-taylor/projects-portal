import {
  IsBoolean,
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @IsEmail()
  @MaxLength(30)
  @IsNotEmpty()
  @IsDefined()
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/, {
    message:
      'Password must contain at least 8 characters, including uppercase, lowercase, number and special character',
  })
  @IsDefined()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @MaxLength(30)
  @IsDefined()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @MaxLength(30)
  @IsDefined()
  @IsNotEmpty()
  lastName!: string;

  @IsBoolean()
  @IsOptional()
  admin = false;
}
