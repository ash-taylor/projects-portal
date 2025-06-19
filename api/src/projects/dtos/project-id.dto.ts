import { IsDefined, IsNotEmpty, IsUUID } from 'class-validator';

export class ProjectIDDto {
  @IsUUID()
  @IsDefined()
  @IsNotEmpty()
  id!: string;
}
