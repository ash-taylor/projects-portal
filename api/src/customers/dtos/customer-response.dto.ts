import { IsArray, IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { ProjectResponseDto } from '../../projects/dtos/project-response.dto';

export class CustomerResponseDto {
  @IsUUID()
  id!: string;

  @IsString()
  name!: string;

  @IsBoolean()
  active!: boolean;

  @IsString()
  @IsOptional()
  details: string | null;

  @IsArray()
  projects!: Omit<ProjectResponseDto, 'customer'>[];
}
