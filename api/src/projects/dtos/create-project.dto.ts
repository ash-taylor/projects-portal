import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ProjectStatus } from '../models/project.entity';

export class CreateProjectDto {
  @IsString()
  @MaxLength(50)
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
  @MaxLength(60)
  details?: string;

  @IsUUID()
  @IsNotEmpty()
  @IsDefined()
  customerId!: string;

  @IsArray()
  userEmails: string[] = [];
}
