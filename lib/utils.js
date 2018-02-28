'use strict';

const PromiseInspection = require('./PromiseInspection').PromiseInspection;

function defer() {
  let resolve = null;
  let reject = null;

  const promise = new Promise((resolver, rejecter) => {
    resolve = resolver;
    reject = rejecter;
  });

  return {
    promise,
    resolve,
    reject
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

function checkRequiredTime(time) {
  return typeof time === 'number' && time === Math.round(time) && time > 0;
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

module.exports = {
  now,
  defer,
  delay,
  reflect,
  duration,
  tryPromise,
  checkOptionalTime,
  checkRequiredTime
};
