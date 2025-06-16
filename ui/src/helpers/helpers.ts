import { Roles } from '../models/Roles';
import type { User } from '../models/User';

/**
 * A utility function that returns either the singular 'match' or plural 'matches' dependent on the number of matches found
 * in a table filter
 *
 * @param count Number of matches
 */
export function getMatchesCountText(count: number | undefined) {
  return count === 1 ? '1 match' : `${count} matches`;
}

export const buildAuthorizedOptions = <T extends { admin: boolean }>(options: T[], user: User | undefined): T[] =>
  options.filter((opt) => !opt.admin || (opt.admin && user?.userRoles.includes(Roles.ADMIN)));

export const parseStatus = (status: string) =>
  status
    .split('_')
    .map((word) => `${word[0].toUpperCase()}${word.slice(1)}`)
    .toString()
    .replace(',', ' ');
