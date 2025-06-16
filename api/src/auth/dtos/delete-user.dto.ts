import { IsEmail, MaxLength } from 'class-validator';

export class DeleteUserDto {
  @IsEmail()
  @MaxLength(30)
  email!: string;
}
