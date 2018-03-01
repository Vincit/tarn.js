'use strict';

const Resource = require('./Resource').Resource;
const PendingOperation = require('./PendingOperation').PendingOperation;
const now = require('./utils').now;
const duration = require('./utils').duration;
const checkOptionalTime = require('./utils').checkOptionalTime;
const delay = require('./utils').delay;
const reflect = require('./utils').reflect;
const tryPromise = require('./utils').tryPromise;

class Pool {
  constructor(opt) {
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

    this.creator = opt.create;
    this.destroyer = opt.destroy;
    this.validate = typeof opt.validate === 'function' ? opt.validate : () => true;
    this.log = opt.log || (() => {});

    this.acquireTimeoutMillis = opt.acquireTimeoutMillis || 30000;
    this.createTimeoutMillis = opt.createTimeoutMillis || 30000;
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
    const pendingAcquire = new PendingOperation(this.acquireTimeoutMillis);
    this.pendingAcquires.push(pendingAcquire);

    // If the acquire fails for whatever reason
    // remove it from the pending queue.
    pendingAcquire.promise = pendingAcquire.promise.catch(err => {
      remove(this.pendingAcquires, pendingAcquire);

      return Promise.reject(err);
    });

    this._tryAcquireOrCreate();
    return pendingAcquire;
  }

  release(resource) {
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
    const newFree = [];
    const minKeep = this.min - this.used.length;
    const maxDestroy = this.free.length - minKeep;
    let numDestroyed = 0;

    this.free.forEach(free => {
      if (
        duration(timestamp, free.timestamp) > this.idleTimeoutMillis &&
        numDestroyed < maxDestroy
      ) {
        numDestroyed++;
        this._destroy(free.resource);
      } else {
        newFree.push(free);
      }
    });

    this.free = newFree;

    //Pool is completely empty, stop reaping.
    //Next .acquire will start reaping interval again.
    if (this.isEmpty()) {
      this._stopReaping();
    }
  }

  destroy() {
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
          this.free.forEach(free => this._destroy(free.resource));
          this.free = [];
          this.pendingAcquires = [];
        })
    );
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

  _validateResource(resource) {
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
    const pendingCreate = new PendingOperation(this.createTimeoutMillis);
    this.pendingCreates.push(pendingCreate);

    callbackOrPromise(this.creator)
      .then(resource => {
        remove(this.pendingCreates, pendingCreate);
        this.free.push(new Resource(resource));

        pendingCreate.resolve(resource);
      })
      .catch(err => {
        remove(this.pendingCreates, pendingCreate);

        pendingCreate.reject(err);
      });

    return pendingCreate;
  }

  _destroy(resource) {
    try {
      this.destroyer(resource);
    } catch (err) {
      // There's nothing we can do here but log the error. This would otherwise
      // leak out as an unhandled exception.
      this.log('Tarn: resource destroyer threw an exception ' + err.stack, 'warn');
    }
  }

  _startReaping() {
    if (!this.interval) {
      this.interval = setInterval(() => this.check(), this.reapIntervalMillis);
    }
  }

  _stopReaping() {
    clearInterval(this.interval);
    this.interval = null;
  }
}

function remove(arr, item) {
  var idx = arr.indexOf(item);

  if (idx === -1) {
    return false;
  } else {
    arr.splice(idx, 1);
    return true;
  }
}

function callbackOrPromise(func) {
  return new Promise((resolve, reject) => {
    const callback = (err, resource) => {
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

module.exports = {
  Pool
};
