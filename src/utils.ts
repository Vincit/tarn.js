import { PromiseInspection } from './PromiseInspection';

export interface Deferred<T> {
  resolve: (val: T) => any;
  reject: <T>(err: T) => any;
  promise: Promise<T>;
}

export function defer<T>(): Deferred<T> {
  let resolve: any = null;
  let reject: any = null;

  const promise = new Promise<T>((resolver, rejecter) => {
    resolve = resolver;
    reject = rejecter;
  });

  return {
    promise,
    resolve,
    reject
  } as Deferred<T>;
}

export function now() {
  return Date.now();
}

export function duration(t1: number, t2: number) {
  return Math.abs(t2 - t1);
}

export function checkOptionalTime(time?: number) {
  if (typeof time === 'undefined') {
    return true;
  }
  return checkRequiredTime(time);
}

export function checkRequiredTime(time: number) {
  return typeof time === 'number' && time === Math.round(time) && time > 0;
}

export function delay(millis: number) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

export function reflect<T>(promise: Promise<T>) {
  return promise
    .then(value => {
      return new PromiseInspection({ value });
    })
    .catch(error => {
      return new PromiseInspection({ error });
    });
}

export function tryPromise<T>(cb: () => T | PromiseLike<T>) {
  try {
    const result = cb();
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
}
