'use strict';

const TimeoutError = require('./TimeoutError').TimeoutError;
const defer = require('./utils').defer;

class PendingOperation {
  constructor(timeoutMillis) {
    this.deferred = defer();
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

  reject(err) {
    this.deferred.reject(err);
  }

  resolve(value) {
    this.deferred.resolve(value);
  }
}

function timeout(promise, time) {
  return new Promise((resolve, reject) => {
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

module.exports = {
  PendingOperation
};
