import { IsArray, IsBoolean, IsEnum, IsInstance, IsOptional, IsString, IsUUID } from 'class-validator';
import { CustomerResponseDto } from '../../customers/dtos/customer-response.dto';
import { UserResponseDto } from '../../users/dtos/user-response.dto';
import { ProjectStatus } from '../models/project.entity';

export class ProjectResponseDto {
  @IsUUID()
  id!: string;

  @IsString()
  name!: string;

  @IsBoolean()
  active!: boolean;

  @IsEnum(ProjectStatus)
  status!: ProjectStatus;

  @IsString()
  @IsOptional()
  details: string | null;

  @IsInstance(CustomerResponseDto)
  @IsOptional()
  customer?: Omit<CustomerResponseDto, 'projects'>;

  @IsArray()
  users!: Omit<UserResponseDto, 'project'>[];
}
