import type { Roles } from './Roles';

export interface User {
  email: string;
  firstName: string;
  lastName: string;
  userRoles: Roles[];
  active: boolean;
  project: { [key: string]: string | boolean } | null;
}
