const { TimeoutError } = require('./TimeoutError');
const { defer, checkRequiredTime, timeout } = require('./utils');

class PendingOperation {
  constructor(timeoutMillis) {
    if (!checkRequiredTime(timeoutMillis)) {
      throw new Error('should never happen!');
    }

    this.deferred = defer();
    this.possibleTimeoutCause = null;

    this.promise = timeout(this.deferred.promise, timeoutMillis).catch(err => {
      if (err instanceof TimeoutError && this.possibleTimeoutCause) {
        err = new TimeoutError(this.possibleTimeoutCause.message);
      }

      return Promise.reject(err);
    });
  }

  abort() {
    this.deferred.reject(new Error('aborted'));
  }

  isRejected() {
    return this.rejected;
  }

  reject(err) {
    this.deferred.reject(err);
  }

  resolve(value) {
    this.deferred.resolve(value);
  }
}

module.exports = {
  PendingOperation
};
