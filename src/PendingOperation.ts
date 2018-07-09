import { TimeoutError } from './TimeoutError';
import { defer, Deferred } from './utils';

export class PendingOperation<T> {
  public possibleTimeoutCause: Error | null;
  public promise: Promise<T>;
  protected deferred: Deferred<T>;

  constructor(protected timeoutMillis: number) {
    this.deferred = defer<T>();
    this.possibleTimeoutCause = null;

    this.promise = timeout(this.deferred.promise, timeoutMillis).catch(err => {
      if (err instanceof TimeoutError) {
        if (this.possibleTimeoutCause) {
          err = new TimeoutError(this.possibleTimeoutCause.message);
        } else {
          err = new TimeoutError('operation timed out for an unknown reason');
        }
      }

      return Promise.reject(err);
    });
  }

  abort() {
    this.reject(new Error('aborted'));
  }

  reject(err: Error) {
    this.deferred.reject(err);
  }

  resolve(value: T) {
    this.deferred.resolve(value);
  }
}

function timeout<T>(promise: Promise<T>, time: number) {
  return new Promise<T>((resolve, reject) => {
    const timeoutHandle = setTimeout(() => reject(new TimeoutError()), time);

    promise
      .then(result => {
        clearTimeout(timeoutHandle);
        resolve(result);
      })
      .catch(err => {
        clearTimeout(timeoutHandle);
        reject(err);
      });
  });
}
