import { PendingOperation } from './PendingOperation';
import { Resource } from './Resource';
import { checkOptionalTime, delay, duration, now, reflect, tryPromise } from './utils';
import { EventEmitter } from 'events';

export interface PoolOptions<T> {
  create: CallbackOrPromise<T>;
  destroy: (resource: T) => any;
  min: number;
  max: number;
  acquireTimeoutMillis?: number;
  createTimeoutMillis?: number;
  destroyTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  createRetryIntervalMillis?: number;
  reapIntervalMillis?: number;
  log?: (msg: string) => any;
  validate?: (resource: T) => boolean;
  propagateCreateError?: boolean;
}

export class Pool<T> {
  protected min: number;
  protected max: number;
  protected used: Resource<T>[];
  protected free: Resource<T>[];
  protected pendingCreates: PendingOperation<T>[];
  protected pendingAcquires: PendingOperation<T>[];
  protected interval: NodeJS.Timer | null;
  protected destroyed: boolean = false;
  protected propagateCreateError: boolean;
  protected idleTimeoutMillis: number;
  protected createRetryIntervalMillis: number;
  protected reapIntervalMillis: number;
  protected createTimeoutMillis: number;
  protected destroyTimeoutMillis: number;
  protected acquireTimeoutMillis: number;
  protected log: (msg: string, level: 'warn') => any;
  protected creator: CallbackOrPromise<T>;
  protected destroyer: (resource: T) => any;
  protected validate: (resource: T) => boolean;
  protected eventId: number;
  protected emitter = new EventEmitter();

  constructor(opt: PoolOptions<T>) {
    opt = opt || {};

    if (!opt.create) {
      throw new Error('Tarn: opt.create function most be provided');
    }

    if (!opt.destroy) {
      throw new Error('Tarn: opt.destroy function most be provided');
    }

    if (typeof opt.min !== 'number' || opt.min < 0 || opt.min !== Math.round(opt.min)) {
      throw new Error('Tarn: opt.min must be an integer >= 0');
    }

    if (typeof opt.max !== 'number' || opt.max <= 0 || opt.max !== Math.round(opt.max)) {
      throw new Error('Tarn: opt.max must be an integer > 0');
    }

    if (opt.min > opt.max) {
      throw new Error('Tarn: opt.max is smaller than opt.min');
    }

    if (!checkOptionalTime(opt.acquireTimeoutMillis)) {
      throw new Error(
        'Tarn: invalid opt.acquireTimeoutMillis ' + JSON.stringify(opt.acquireTimeoutMillis)
      );
    }

    if (!checkOptionalTime(opt.createTimeoutMillis)) {
      throw new Error(
        'Tarn: invalid opt.createTimeoutMillis ' + JSON.stringify(opt.createTimeoutMillis)
      );
    }

    if (!checkOptionalTime(opt.destroyTimeoutMillis)) {
      throw new Error(
        'Tarn: invalid opt.destroyTimeoutMillis ' + JSON.stringify(opt.destroyTimeoutMillis)
      );
    }

    if (!checkOptionalTime(opt.idleTimeoutMillis)) {
      throw new Error(
        'Tarn: invalid opt.idleTimeoutMillis ' + JSON.stringify(opt.idleTimeoutMillis)
      );
    }

    if (!checkOptionalTime(opt.reapIntervalMillis)) {
      throw new Error(
        'Tarn: invalid opt.reapIntervalMillis ' + JSON.stringify(opt.reapIntervalMillis)
      );
    }

    if (!checkOptionalTime(opt.createRetryIntervalMillis)) {
      throw new Error(
        'Tarn: invalid opt.createRetryIntervalMillis ' +
          JSON.stringify(opt.createRetryIntervalMillis)
      );
    }

    const allowedKeys: { [key: string]: boolean } = {
      create: true,
      validate: true,
      destroy: true,
      log: true,
      min: true,
      max: true,
      acquireTimeoutMillis: true,
      createTimeoutMillis: true,
      destroyTimeoutMillis: true,
      idleTimeoutMillis: true,
      reapIntervalMillis: true,
      createRetryIntervalMillis: true,
      propagateCreateError: true
    };

    for (let key of Object.keys(opt)) {
      if (!allowedKeys[key]) {
        throw new Error(`Tarn: unsupported option opt.${key}`);
      }
    }

    this.creator = opt.create;
    this.destroyer = opt.destroy;
    this.validate = typeof opt.validate === 'function' ? opt.validate : () => true;
    this.log = opt.log || (() => {});

    this.acquireTimeoutMillis = opt.acquireTimeoutMillis || 30000;
    this.createTimeoutMillis = opt.createTimeoutMillis || 30000;
    this.destroyTimeoutMillis = opt.destroyTimeoutMillis || 5000;
    this.idleTimeoutMillis = opt.idleTimeoutMillis || 30000;
    this.reapIntervalMillis = opt.reapIntervalMillis || 1000;
    this.createRetryIntervalMillis = opt.createRetryIntervalMillis || 200;
    this.propagateCreateError = !!opt.propagateCreateError;

    this.min = opt.min;
    this.max = opt.max;

    this.used = [];
    this.free = [];

    this.pendingCreates = [];
    this.pendingAcquires = [];
    this.destroyed = false;
    this.interval = null;

    this.eventId = 1;
  }

  numUsed() {
    return this.used.length;
  }

  numFree() {
    return this.free.length;
  }

  numPendingAcquires() {
    return this.pendingAcquires.length;
  }

  numPendingCreates() {
    return this.pendingCreates.length;
  }

  acquire() {
    const eventId = this.eventId++;
    this._executeEventHandlers('acquireRequest', eventId);

    const pendingAcquire = new PendingOperation<T>(this.acquireTimeoutMillis);
    this.pendingAcquires.push(pendingAcquire);

    // If the acquire fails for whatever reason
    // remove it from the pending queue.
    pendingAcquire.promise = pendingAcquire.promise
      .then(resource => {
        this._executeEventHandlers('acquireSuccess', eventId, resource);
        return resource;
      })
      .catch(err => {
        this._executeEventHandlers('acquireFail', eventId, err);
        remove(this.pendingAcquires, pendingAcquire);
        return Promise.reject(err);
      });

    this._tryAcquireOrCreate();
    return pendingAcquire;
  }

  release(resource: T) {
    this._executeEventHandlers('release', resource);

    for (let i = 0, l = this.used.length; i < l; ++i) {
      const used = this.used[i];

      if (used.resource === resource) {
        this.used.splice(i, 1);
        this.free.push(used.resolve());

        this._tryAcquireOrCreate();
        return true;
      }
    }

    return false;
  }

  isEmpty() {
    return (
      [this.numFree(), this.numUsed(), this.numPendingAcquires(), this.numPendingCreates()].reduce(
        (total, value) => total + value
      ) === 0
    );
  }

  check() {
    const timestamp = now();
    const newFree: Resource<T>[] = [];
    const minKeep = this.min - this.used.length;
    const maxDestroy = this.free.length - minKeep;
    let numDestroyed = 0;

    this.free.forEach(free => {
      if (
        duration(timestamp, free.timestamp) >= this.idleTimeoutMillis &&
        numDestroyed < maxDestroy
      ) {
        numDestroyed++;
        this._destroy(free.resource);
      } else {
        newFree.push(free);
      }
    });

    this.free = newFree;

    // Pool is completely empty, stop reaping.
    // Next .acquire will start reaping interval again.
    if (this.isEmpty()) {
      this._stopReaping();
    }
  }

  destroy() {
    const eventId = this.eventId++;
    this._executeEventHandlers('poolDestroyRequest', eventId);

    this._stopReaping();
    this.destroyed = true;

    // First wait for all the pending creates get ready.
    return reflect(
      Promise.all(this.pendingCreates.map(create => reflect(create.promise)))
        .then(() => {
          // Wait for all the used resources to be freed.
          return Promise.all(this.used.map(used => reflect(used.promise)));
        })
        .then(() => {
          // Abort all pending acquires.
          return Promise.all(
            this.pendingAcquires.map(acquire => {
              acquire.abort();
              return reflect(acquire.promise);
            })
          );
        })
        .then(() => {
          // Now we can destroy all the freed resources.
          return Promise.all(this.free.map(free => reflect(this._destroy(free.resource))));
        })
        .then(() => {
          this.free = [];
          this.pendingAcquires = [];
        })
    ).then(res => {
      this._executeEventHandlers('poolDestroySuccess', eventId);
      this.emitter.removeAllListeners();
      return res;
    });
  }

  // Event id can be used to track, which success / failure corresponds with which request
  on(eventName: 'acquireRequest', handler: (eventId: number) => void): void;
  on(eventName: 'acquireSuccess', handler: (eventId: number, resource: T) => void): void;
  on(eventName: 'acquireFail', handler: (eventId: number, err: Error) => void): void;

  on(eventName: 'release', handler: (resource: T) => void): void;

  on(eventName: 'createRequest', handler: (eventId: number) => void): void;
  on(eventName: 'createSuccess', handler: (eventId: number, resource: T) => void): void;
  on(eventName: 'createFail', handler: (eventId: number, err: Error) => void): void;

  on(eventName: 'destroyRequest', handler: (eventId: number, resource: T) => void): void;
  on(eventName: 'destroySuccess', handler: (eventId: number, resource: T) => void): void;
  on(eventName: 'destroyFail', handler: (eventId: number, resource: T, err: Error) => void): void;

  on(eventName: 'startReaping', handler: () => void): void;
  on(eventName: 'stopReaping', handler: () => void): void;

  on(eventName: 'poolDestroyRequest', handler: (eventId: number) => void): void;
  on(eventName: 'poolDestroySuccess', handler: (eventId: number) => void): void;

  on(event: string | symbol, listener: (...args: any) => void): void {
    this.emitter.on(event, listener);
  }

  removeListener(event: string | symbol, listener: (...args: any[]) => void): void {
    this.emitter.removeListener(event, listener);
  }

  removeAllListeners(event?: string | symbol | undefined): void {
    this.emitter.removeAllListeners(event);
  }

  _tryAcquireOrCreate() {
    if (this.destroyed) {
      return;
    }

    if (this._hasFreeResources()) {
      this._doAcquire();
    } else if (this._shouldCreateMoreResources()) {
      this._doCreate();
    }
  }

  _hasFreeResources() {
    return this.free.length > 0;
  }

  _doAcquire() {
    let didDestroyResources = false;

    while (this._canAcquire()) {
      const pendingAcquire = this.pendingAcquires[0];
      const free = this.free[this.free.length - 1];

      if (!this._validateResource(free.resource)) {
        this.free.pop();
        this._destroy(free.resource);
        didDestroyResources = true;
        continue;
      }

      this.pendingAcquires.shift();
      this.free.pop();
      this.used.push(free.resolve());

      //At least one active resource, start reaping
      this._startReaping();

      pendingAcquire.resolve(free.resource);
    }

    // If we destroyed invalid resources, we may need to create new ones.
    if (didDestroyResources) {
      this._tryAcquireOrCreate();
    }
  }

  _canAcquire() {
    return this.free.length > 0 && this.pendingAcquires.length > 0;
  }

  _validateResource(resource: T) {
    try {
      return !!this.validate(resource);
    } catch (err) {
      // There's nothing we can do here but log the error. This would otherwise
      // leak out as an unhandled exception.
      this.log('Tarn: resource validator threw an exception ' + err.stack, 'warn');

      return false;
    }
  }

  _shouldCreateMoreResources() {
    return (
      this.used.length + this.pendingCreates.length < this.max &&
      this.pendingCreates.length < this.pendingAcquires.length
    );
  }

  _doCreate() {
    const pendingAcquiresBeforeCreate = this.pendingAcquires.slice();
    const pendingCreate = this._create();

    pendingCreate.promise
      .then(() => {
        // Not returned on purpose.
        this._tryAcquireOrCreate();
        return null;
      })
      .catch(err => {
        if (this.propagateCreateError && this.pendingAcquires.length !== 0) {
          // If propagateCreateError is true, we don't retry the create
          // but reject the first pending acquire immediately. Intentionally
          // use `this.pendingAcquires` instead of `pendingAcquiresBeforeCreate`
          // in case some acquires in pendingAcquiresBeforeCreate have already
          // been resolved.
          this.pendingAcquires[0].reject(err);
        }

        // Save the create error to all pending acquires so that we can use it
        // as the error to reject the acquire if it times out.
        pendingAcquiresBeforeCreate.forEach(pendingAcquire => {
          pendingAcquire.possibleTimeoutCause = err;
        });

        // Not returned on purpose.
        delay(this.createRetryIntervalMillis).then(() => this._tryAcquireOrCreate());
      });
  }

  _create() {
    const eventId = this.eventId++;
    this._executeEventHandlers('createRequest', eventId);

    const pendingCreate = new PendingOperation<T>(this.createTimeoutMillis);
    this.pendingCreates.push(pendingCreate);

    callbackOrPromise<T>(this.creator)
      .then(resource => {
        remove(this.pendingCreates, pendingCreate);
        this.free.push(new Resource(resource));

        // Not returned on purpose.
        pendingCreate.resolve(resource);
        this._executeEventHandlers('createSuccess', eventId, resource);
        return null;
      })
      .catch(err => {
        remove(this.pendingCreates, pendingCreate);

        // Not returned on purpose.
        pendingCreate.reject(err);
        this._executeEventHandlers('createFail', eventId, err);
        return null;
      });

    return pendingCreate;
  }

  _destroy(resource: T) {
    const eventId = this.eventId++;
    this._executeEventHandlers('destroyRequest', eventId, resource);

    // this.destroyer can be both synchronous and asynchronous.
    // so we wrap it to promise to get all exceptions through same pipeline
    const pendingDestroy = new PendingOperation<T>(this.destroyTimeoutMillis);
    const retVal = Promise.resolve().then(() => this.destroyer(resource));
    retVal
      .then(() => {
        pendingDestroy.resolve(resource);
      })
      .catch((err: Error) => {
        pendingDestroy.reject(err);
      });

    // In case of an error there's nothing we can do here but log it.
    return pendingDestroy.promise
      .then(res => {
        this._executeEventHandlers('destroySuccess', eventId, resource);
        return res;
      })
      .catch(err => this._logDestroyerError(eventId, resource, err));
  }

  _logDestroyerError(eventId: number, resource: T, err: Error) {
    this._executeEventHandlers('destroyFail', eventId, resource, err);
    this.log('Tarn: resource destroyer threw an exception ' + err.stack, 'warn');
  }

  _startReaping() {
    if (!this.interval) {
      this._executeEventHandlers('startReaping');
      this.interval = setInterval(() => this.check(), this.reapIntervalMillis);
    }
  }

  _stopReaping() {
    if (this.interval !== null) {
      this._executeEventHandlers('stopReaping');
      clearInterval(this.interval);
    }
    this.interval = null;
  }

  _executeEventHandlers(eventName: string, ...args: any) {
    const listeners = this.emitter.listeners(eventName);
    // just calling .emit() would stop running rest of the listeners if one them fails
    listeners.forEach(listener => {
      try {
        listener(...args);
      } catch (err) {
        // There's nothing we can do here but log the error. This would otherwise
        // leak out as an unhandled exception.
        this.log(`Tarn: event handler "${eventName}" threw an exception ${err.stack}`, 'warn');
      }
    });
  }
}

function remove<T>(arr: T[], item: T) {
  var idx = arr.indexOf(item);

  if (idx === -1) {
    return false;
  } else {
    arr.splice(idx, 1);
    return true;
  }
}

export type Callback<T> = (err: Error | null, resource: T) => any;
export type CallbackOrPromise<T> = (cb: Callback<T>) => any | (() => Promise<T>);

function callbackOrPromise<T>(func: CallbackOrPromise<T>) {
  return new Promise<T>((resolve, reject) => {
    const callback: Callback<T> = (err, resource) => {
      if (err) {
        reject(err);
      } else {
        resolve(resource);
      }
    };

    tryPromise(() => func(callback))
      .then(res => {
        // If the result is falsy, we assume that the callback will
        // be called instead of interpreting the falsy value as a
        // result value.
        if (res) {
          resolve(res);
        }
      })
      .catch(err => {
        reject(err);
      });
  });
}
