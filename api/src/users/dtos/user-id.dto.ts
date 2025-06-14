import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class UserIDDto {
  @IsString()
  @IsDefined()
  @IsNotEmpty()
  id!: string;
}
