import type { AuthEvents } from './AuthEvents';
import type { IAuthObserver } from './IAuthObserver';

export interface IAuthSubject {
  attach(observer: IAuthObserver): void;
  detach(observer: IAuthObserver): void;
  notify(event: AuthEvents): void;
}
