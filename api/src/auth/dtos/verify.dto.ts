import { IsDefined, IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VerifyDto {
  @IsEmail()
  @MaxLength(30)
  @IsNotEmpty()
  @IsDefined()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @IsDefined()
  confirmationCode: string;
}
