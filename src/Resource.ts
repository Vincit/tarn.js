import { defer, now, Deferred } from './utils';

export class Resource<T> {
  readonly timestamp: number;
  protected deferred: Deferred<void>;

  constructor(public resource: T) {
    this.resource = resource;
    this.timestamp = now();
    this.deferred = defer<void>();
  }

  get promise() {
    return this.deferred.promise;
  }

  resolve() {
    this.deferred.resolve(undefined);
    return new Resource(this.resource);
  }
}
