export enum AuthEvents {
  AUTH_REFRESH_FAILED = 'AUTH_REFRESH_FAILED',
}

export interface IAuthSubject {
  attach(observer: IAuthObserver): void;
  detach(observer: IAuthObserver): void;
  notify(event: AuthEvents): void;
}

export interface IAuthObserver {
  update(event: AuthEvents): void;
}

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
