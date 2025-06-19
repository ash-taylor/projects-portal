import { isUserAuthorized } from '../components/auth/helpers/helpers';
import { Roles } from '../models/Roles';
import type { User } from '../models/User';

/**
 * A utility function that returns either the singular 'match' or plural 'matches' dependent on the number of matches found
 * in a table filter
 *
 * @param count Number of matches
 * @returns String with the correct pluralization
 */
export function getMatchesCountText(count: number | undefined) {
  return count === 1 ? '1 match' : `${count} matches`;
}

/**
 *
 * @param options An array of options to filter, with an admin flag
 * @param user The logged in user object
 * @returns An array of options that are authorized for the user
 */
export const buildAuthorizedOptions = <T extends { admin: boolean; editConfig?: object | undefined }>(
  options: T[],
  user: User | undefined,
): T[] =>
  options
    .filter((opt) => !opt.admin || (opt.admin && user?.userRoles.includes(Roles.ADMIN)))
    .map((opt) => {
      if (!isUserAuthorized(user, [Roles.ADMIN]) && opt.editConfig) delete opt.editConfig;
      return opt;
    });

/**
 *
 * @param status A Status enum e.g. in_planning
 * @returns A parsed, readable version e.g. In planning
 */
export const parseStatus = (status: string) =>
  status
    .split('_')
    .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
    .toString()
    .replace(',', ' ');
