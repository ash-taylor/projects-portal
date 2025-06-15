import { IsUUID, IsDefined, IsNotEmpty } from 'class-validator';

export class ProjectIDDto {
  @IsUUID()
  @IsDefined()
  @IsNotEmpty()
  id!: string;
}
