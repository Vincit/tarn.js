var Promise = require('bluebird');
var RECURSION_LIMIT = 100;

function Pool(opt) {
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
    throw new Error('Tarn: invalid opt.acquireTimeoutMillis ' + JSON.stringify(opt.acquireTimeoutMillis));
  }

  if (!checkOptionalTime(opt.createTimeoutMillis)) {
    throw new Error('Tarn: invalid opt.createTimeoutMillis ' + JSON.stringify(opt.createTimeoutMillis));
  }

  if (!checkOptionalTime(opt.idleTimeoutMillis)) {
    throw new Error('Tarn: invalid opt.idleTimeoutMillis ' + JSON.stringify(opt.idleTimeoutMillis));
  }

  if (!checkOptionalTime(opt.reapIntervalMillis)) {
    throw new Error('Tarn: invalid opt.reapIntervalMillis ' + JSON.stringify(opt.reapIntervalMillis));
  }

  this.creator = opt.create;
  this.destroyer = opt.destroy;
  this.validate = typeof opt.validate === 'function' ? opt.validate : function () { return true; };
  this.log = opt.log || function () {};

  this.acquireTimeoutMillis = opt.acquireTimeoutMillis || 30000;
  this.createTimeoutMillis = opt.createTimeoutMillis || 30000;
  this.idleTimeoutMillis = opt.idleTimeoutMillis || 30000;
  this.reapIntervalMillis = opt.reapIntervalMillis || 1000;

  this.min = opt.min;
  this.max = opt.max;

  this.used = [];
  this.free = [];

  this.pendingCreates = [];
  this.pendingAcquires = [];
  this.destroyed = false;

  var self = this;
  this.interval = setInterval(function () {
    self.check();
  }, this.reapIntervalMillis);
}

Pool.prototype.numUsed = function () {
  return this.used.length;
};

Pool.prototype.numFree = function () {
  return this.free.length;
};

Pool.prototype.numPendingAcquires = function () {
  return this.pendingAcquires.length;
};

Pool.prototype.numPendingCreates = function () {
  return this.pendingCreates.length;
};

Pool.prototype.acquire = function () {
  var self = this;

  var pendingAcquire = new PendingOperation(this.acquireTimeoutMillis);
  this.pendingAcquires.push(pendingAcquire);

  pendingAcquire.promise = pendingAcquire.promise.catch(function (err) {
    remove(self.pendingAcquires, pendingAcquire);
    return Promise.reject(err);
  });

  this._tryAcquireNext(0);
  return pendingAcquire;
};

Pool.prototype.release = function (resource) {
  for (var i = 0, l = this.used.length; i < l; ++i) {
    var used = this.used[i];

    if (used.resource === resource) {
      this.used.splice(i, 1);
      this.free.push(used.toFree());

      this._tryAcquireNext(0);
      return true;
    }
  }

  return false;
};

Pool.prototype.check = function () {
  var self = this;
  var timestamp = now();
  var newFree = [];
  var minKeep = this.min - this.used.length;
  var maxDestroy = this.free.length - minKeep;
  var numDestroyed = 0;

  this.free.forEach(function (free) {
    if (duration(timestamp, free.timestamp) > self.idleTimeoutMillis && numDestroyed < maxDestroy) {
      numDestroyed++;
      self._destroy(free.resource);
    } else {
      newFree.push(free);
    }
  });

  this.free = newFree;
};

Pool.prototype.destroy = function() {
  var self = this;

  this._stopReaping();
  this.destroyed = true;

  // First wait for all the pending creates get ready.
  return Promise.all(this.pendingCreates.map(function (create) {
    return create.promise.reflect();
  })).then(function () {
    // Wait for all the used resources to be freed.
    return Promise.all(self.used.map(function (used) {
      return used.freed.promise.reflect();
    }));
  }).then(function () {
    // Abort all pending acquires.
    return Promise.all(self.pendingAcquires.map(function (acquire) {
      acquire.abort();
      return acquire.promise.reflect();
    }));
  }).then(function () {
    // Now we can destroy all the freed resources.
    self.free.map(function (free) {
      self._destroy(free.resource);
    });

    self.free = [];
    self.pendingAcquires = [];
  }).reflect();
};

Pool.prototype._tryAcquireNext = function (recursion) {
  recursion = (recursion || 0) + 1;

  if (this.destroyed || this.used.length >= this.max || this.pendingAcquires.length === 0 || recursion > RECURSION_LIMIT) {
    // Nothing to do.
    return;
  }

  if (this.free.length > 0) {
    this._acquireNext(recursion);
  } else if (this.used.length + this.pendingCreates.length < this.max && this.pendingCreates.length < this.pendingAcquires.length) {
    var self = this;

    this._create().promise.then(function () {
      self._tryAcquireNext(recursion);
    }).catch(function (err) {
      self.log('Tarn: resource creator threw an exception ' + err.stack, 'warn');
    });
  }
};

Pool.prototype._acquireNext = function (recursion) {
  while (this.free.length > 0 && this.pendingAcquires.length > 0) {
    var pendingAcquire = this.pendingAcquires[0];
    var free = this.free[this.free.length - 1];

    if (pendingAcquire.isRejected()) {
      this.pendingAcquires.shift();
      continue;
    }

    if (!this.validate(free.resource)) {
      this.free.pop();
      this._destroy(free.resource);
      continue;
    }

    this.pendingAcquires.shift();
    this.free.pop();
    this.used.push(free.toUsed());

    pendingAcquire.ready.resolve(free.resource);
  }

  // If we destroyed invalid resources, we may need to create new ones.
  if (this.pendingAcquires.length > this.pendingCreates.length) {
    this._tryAcquireNext(recursion);
  }
};

Pool.prototype._create = function () {
  var self = this;

  var pendingCreate = new PendingOperation(this.createTimeoutMillis);
  this.pendingCreates.push(pendingCreate);

  callbackOrPromise(self.creator, []).then(function (resource) {
    remove(self.pendingCreates, pendingCreate);

    if (pendingCreate.isRejected()) {
      // This happens if the pending operation times out or is aborted. In any case,
      // we need to destroy the resource since no-one will ever use it.
      this._destroy(resource);
    } else {
      self.free.push(new FreeResource(resource));
      pendingCreate.ready.resolve(resource);
    }
  }).catch(function (err) {
    remove(self.pendingCreates, pendingCreate);

    pendingCreate.ready.reject(err);
  });

  return pendingCreate;
};

Pool.prototype._destroy = function (resource) {
  try {
    this.destroyer(resource);
  } catch (err) {
    this.log('Tarn: resource destroyer threw an exception ' + err.stack, 'warn');
  }
};

Pool.prototype._stopReaping = function () {
  clearTimeout(this.interval);
  this.interval = null;
};

function FreeResource(resource) {
  this.resource = resource;
  this.timestamp = now();
  this.used = defer();
}

FreeResource.prototype.toUsed = function () {
  this.used.resolve();
  return new UsedResource(this.resource);
};

function UsedResource(resource) {
  this.resource = resource;
  this.timestamp = now();
  this.freed = defer();
}

UsedResource.prototype.toFree = function () {
  this.freed.resolve();
  return new FreeResource(this.resource);
};

function PendingOperation(timeout) {
  if (!checkRequiredTime(timeout)) {
    throw new Error('should never happen!');
  }

  this.ready = defer();
  this.promise = this.ready.promise.timeout(timeout);
}

PendingOperation.prototype.abort = function () {
  this.ready.reject(new Error('aborted'));
};

PendingOperation.prototype.isRejected = function () {
  return this.ready.promise.isRejected();
};

function now() {
  return Date.now();
}

function duration(t1, t2) {
  return Math.abs(t2 - t1);
}

function remove(arr, item) {
  var idx = arr.indexOf(item);

  if (idx !== -1) {
    arr.splice(idx, 1);
  }
}

function checkOptionalTime(time) {
  if (typeof time === 'undefined') {
    return true;
  } else {
    return checkRequiredTime(time);
  }
}

function checkRequiredTime(time) {
  return typeof time === 'number' && time === Math.round(time) && time > 0;
}

function callbackOrPromise(func, args) {
  return new Promise(function (resolve, reject) {
    args.push(function (err, resource) {
      if (err) {
        reject(err);
      } else {
        resolve(resource);
      }
    });

    Promise.try(function () {
      return func.apply(undefined, args);
    }).then(function (res) {
      if (res) {
        resolve(res);
      }
    }).catch(reject);
  });
}

function defer() {
  var resolve = null;
  var reject = null;

  var promise = new Promise(function (resolver, rejecter) {
    resolve = resolver;
    reject = rejecter;
  });

  return {
    promise: promise,
    resolve: resolve,
    reject: reject
  };
}

module.exports = {
  Pool: Pool,
  Promise: Promise,
  TimeoutError: Promise.TimeoutError
};