import type { Roles } from './Roles';

export type User = {
  email: string;
  firstName: string;
  lastName: string;
  roles: Roles[];
};
