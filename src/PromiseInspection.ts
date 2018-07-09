export type PromiseInspectionArgs<T> =
  | {
      value: T;
      error?: Error;
    }
  | {
      value?: T;
      error: Error;
    };

export class PromiseInspection<T> {
  _value: T | void;
  _error: Error | void;

  constructor(args: PromiseInspectionArgs<T>) {
    this._value = args.value;
    this._error = args.error;
  }

  value() {
    return this._value;
  }

  reason() {
    return this._error;
  }

  isRejected() {
    return !!this._error;
  }

  isFulfilled() {
    return !!this._value;
  }
}
