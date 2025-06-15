import { IsArray, IsBoolean, IsEmail, IsInstance, IsString } from 'class-validator';
import { Role } from '../../auth/models/role.enum';
import { ProjectResponseDto } from '../../projects/dtos/project-response.dto';

export class UserResponseDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsArray()
  userRoles: Role[];

  @IsEmail()
  email: string;

  @IsBoolean()
  active: boolean;

  @IsInstance(ProjectResponseDto)
  project?: ProjectResponseDto;
}
