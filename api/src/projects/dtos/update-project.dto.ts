import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProjectStatus } from '../models/project.entity';

export class UpdateProjectDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  details?: string;
}
