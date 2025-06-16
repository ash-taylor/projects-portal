import { IsDefined, IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SignInDto {
  @IsEmail()
  @MaxLength(30)
  @IsNotEmpty()
  @IsDefined()
  email!: string;

  @IsString()
  @MinLength(8)
  @IsDefined()
  password!: string;
}
