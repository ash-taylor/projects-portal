import { IsDefined, IsNotEmpty, IsUUID } from 'class-validator';

export class CustomerIDDto {
  @IsUUID()
  @IsDefined()
  @IsNotEmpty()
  id!: string;
}
