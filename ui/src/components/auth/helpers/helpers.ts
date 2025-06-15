import type { Roles } from '../../../models/Roles';
import type { User } from '../../../models/User';

export const isUserAuthorized = (user: User | undefined, roles: Roles[]) => {
  if (!user) return false;
  for (let i = 0; i < roles.length; i++) if (user.userRoles.includes(roles[i])) return true;

  return false;
};
