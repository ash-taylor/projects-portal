import { IsDefined, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyDto {
  @IsEmail()
  @IsNotEmpty()
  @IsDefined()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @IsDefined()
  confirmationCode: string;
}
