import type { AuthEvents } from './AuthEvents';

export interface IAuthObserver {
  update(event: AuthEvents): void;
}
