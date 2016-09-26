var Promise = require('bluebird');

function Tarn(opt) {
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

  if (!checkOptionalTime(opt.acquireTimeoutMs)) {
    throw new Error('Tarn: invalid opt.acquireTimeoutMs ' + JSON.stringify(opt.acquireTimeoutMs));
  }

  if (!checkOptionalTime(opt.createTimeoutMs)) {
    throw new Error('Tarn: invalid opt.createTimeoutMs ' + JSON.stringify(opt.createTimeoutMs));
  }

  if (!checkOptionalTime(opt.idleTimeoutMs)) {
    throw new Error('Tarn: invalid opt.idleTimeoutMs ' + JSON.stringify(opt.idleTimeoutMs));
  }

  if (!checkOptionalTime(opt.reapIntervalMs)) {
    throw new Error('Tarn: invalid opt.reapIntervalMs ' + JSON.stringify(opt.reapIntervalMs));
  }

  this.creator = opt.create;
  this.destroyer = opt.destroy;
  this.log = opt.log || function () {};

  this.acquireTimeoutMs = opt.acquireTimeoutMs || 30000;
  this.createTimeoutMs = opt.createTimeoutMs || 30000;
  this.idleTimeoutMs = opt.idleTimeoutMs || 30000;
  this.reapIntervalMs = opt.reapIntervalMs || 1000;

  this.min = opt.min;
  this.max = opt.max;

  this.used = [];
  this.free = [];

  this.pendingCreates = [];
  this.pendingAcquires = [];

  var self = this;
  this.interval = setInterval(function () {
    self.check();
  }, this.reapIntervalMs);
}

Tarn.prototype.numUsed = function () {
  return this.used.length;
};

Tarn.prototype.numFree = function () {
  return this.free.length;
};

Tarn.prototype.numPendingAcquires = function () {
  return this.pendingAcquires.length;
};

Tarn.prototype.numPendingCreates = function () {
  return this.pendingCreates.length;
};

Tarn.prototype.acquire = function () {
  var self = this;
  var pendingAcquire = new PendingOperation(this.acquireTimeoutMs);
  this.pendingAcquires.push(pendingAcquire);

  pendingAcquire.promise = pendingAcquire.promise.catch(function (err) {
    remove(self.pendingAcquires, pendingAcquire);
    return Promise.reject(err);
  });

  this._tryAcquireNext();
  return pendingAcquire;
};

Tarn.prototype.release = function (resource) {
  for (var i = 0, l = this.used.length; i < l; ++i) {
    var used = this.used[i];

    if (used.resource === resource) {
      this.used.splice(i, 1);
      this.free.push(new FreeResource(used.resource));
      this._acquireNext();
      return true;
    }
  }

  return false;
};

Tarn.prototype.check = function () {
  var timestamp = now();
  var newFree = [];
  var minKeep = this.min - this.used.length;
  var maxDestroy = this.free.length - minKeep;
  var numDestroyed = 0;

  for (var i = 0, li = this.free.length; i < li; ++i) {
    var free = this.free[i];

    if (duration(timestamp, free.timestamp) > this.idleTimeoutMs && numDestroyed < maxDestroy) {
      numDestroyed++;
      this._destroy(free.resource);
    } else {
      newFree.push(free);
    }
  }

  this.free = newFree;
};

Tarn.prototype.destroy = function() {
  clearInterval(this.interval);
};

Tarn.prototype._tryAcquireNext = function () {
  if (this.used.length >= this.max || this.pendingAcquires.length === 0) {
    // Nothing to do.
    return;
  }

  if (this.free.length > 0) {
    this._acquireNext();
  } else if (this.used.length + this.pendingCreates.length < this.max) {
    var self = this;

    this._create().promise.then(function () {
      self._acquireNext();
    }).catch(function (err) {
      self.log('Tarn: resource creator threw an exception', err.stack);
    });
  }
};

Tarn.prototype._acquireNext = function () {
  while (this.free.length > 0 && this.pendingAcquires.length > 0) {
    var pendingAcquire = this.pendingAcquires.shift();

    if (!pendingAcquire.isRejected()) {
      var free = this.free.shift();

      this.used.push(new UsedResource(free.resource));
      pendingAcquire._resolve(free.resource);
    }
  }
};

Tarn.prototype._create = function () {
  var self = this;

  var pendingCreate = new PendingOperation(this.createTimeoutMs);
  this.pendingCreates.push(pendingCreate);

  try {
    this.creator(function (err, resource) {
      remove(self.pendingCreates, pendingCreate);

      if (err) {
        pendingCreate._reject(err);
      } else {
        if (pendingCreate.isRejected()) {
          // This happens if the pending operation times out or is aborted. In any case,
          // we need to destroy the resource since no-one will ever use it.
          this._destroy(resource);
        } else {
          self.free.push(new FreeResource(resource));
          pendingCreate._resolve(resource);
        }
      }
    });
  } catch (err) {
    remove(self.pendingCreates, pendingCreate);
    pendingCreate._reject(err);
  }

  return pendingCreate;
};

Tarn.prototype._destroy = function (resource) {
  try {
    this.destroyer(resource);
  } catch (err) {
    this.log('Tarn: resource destroyer threw an exception', err.stack);
  }
};

function FreeResource(resource) {
  this.resource = resource;
  this.timestamp = now();
}

function UsedResource(resource) {
  this.resource = resource;
  this.timestamp = now();
}

function PendingOperation(timeout) {
  if (!checkRequiredTime(timeout)) {
    throw new Error('should never happen!');
  }

  this._resolve = null;
  this._reject = null;

  var self = this;
  this.promise = new Promise(function (resolve, reject) {
    self._resolve = resolve;
    self._reject = reject;
  }).timeout(timeout);
}

PendingOperation.prototype.abort = function () {
  this._reject(new Error('aborted'));
};

PendingOperation.prototype.isRejected = function () {
  return this.promise.isRejected();
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

module.exports = {
  Tarn: Tarn
};