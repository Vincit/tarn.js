const { TimeoutError } = require('./TimeoutError');
const { PromiseInspection } = require('./PromiseInspection');

function defer() {
  var resolve = null;
  var reject = null;

  var promise = new Promise((resolver, rejecter) => {
    resolve = resolver;
    reject = rejecter;
  });

  return {
    promise: promise,
    resolve: resolve,
    reject: reject
  };
}

function now() {
  return Date.now();
}

function duration(t1, t2) {
  return Math.abs(t2 - t1);
}

function checkOptionalTime(time) {
  if (typeof time === 'undefined') {
    return true;
  } else {
    return checkRequiredTime(time);
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

function delay(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

function reflect(promise) {
  return promise
    .then(value => {
      return new PromiseInspection({ value });
    })
    .catch(error => {
      return new PromiseInspection({ error });
    });
}

function tryPromise(cb) {
  try {
    const result = cb();
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
}

function checkRequiredTime(time) {
  return typeof time === 'number' && time === Math.round(time) && time > 0;
}

module.exports = {
  now,
  defer,
  delay,
  reflect,
  timeout,
  duration,
  tryPromise,
  checkOptionalTime,
  checkRequiredTime
};
