import type { AuthEvents } from './AuthEvents';
import type { IAuthObserver } from './IAuthObserver';
import type { IAuthSubject } from './IAuthSubject';

export class AuthSubject implements IAuthSubject {
  private observers: IAuthObserver[] = [];

  attach(observer: IAuthObserver): void {
    this.observers.push(observer);
  }

  detach(observer: IAuthObserver): void {
    this.observers = this.observers.filter((obs) => obs !== observer);
  }

  notify(event: AuthEvents): void {
    this.observers.forEach((observer) => observer.update(event));
  }
}
