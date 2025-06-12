import { Role } from '../../auth/models/role.enum';

export interface IUser {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  active: boolean;
}
