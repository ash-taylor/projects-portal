import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsEmail()
  @MaxLength(30)
  @IsOptional()
  email?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @IsOptional()
  lastName?: string;

  @IsUUID()
  @IsOptional()
  project?: string | null;
}
