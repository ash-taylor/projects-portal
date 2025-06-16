import type { Roles } from '../../../models/Roles';
import type { IProjectResponse } from '../../projects/models/IProjectResponse';

export interface IUserResponse {
  [key: string]: string | boolean | IProjectResponse | undefined | Roles[];
  firstName: string;
  lastName: string;
  email: string;
  active: boolean;
  userRoles: Roles[];
  project?: IProjectResponse;
}
