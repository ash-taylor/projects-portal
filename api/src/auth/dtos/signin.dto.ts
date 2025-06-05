import { IsDefined, IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignInDto {
  @IsEmail()
  @IsNotEmpty()
  @IsDefined()
  email!: string;

  @IsString()
  @MinLength(8)
  @IsDefined()
  password!: string;
}
