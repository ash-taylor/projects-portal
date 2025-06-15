import { IsBoolean, IsDefined, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ProjectStatus } from '../models/project.entity';

export class CreateProjectDto {
  @IsString()
  @MaxLength(40)
  @IsNotEmpty()
  @IsDefined()
  name!: string;

  @IsBoolean()
  @IsOptional()
  active = true;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus = ProjectStatus.PLANNING;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  details?: string;

  @IsUUID()
  @IsNotEmpty()
  @IsDefined()
  customerId!: string;
}
