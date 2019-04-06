[![Build Status](https://travis-ci.org/Vincit/tarn.js.svg?branch=master)](https://travis-ci.org/Vincit/tarn.js)

## Why yet another resource pool?

Tarn is focused on robustness and ability to recover from errors. Tarn has timeouts for all operations
that can fail or timeout so that you should never end up with pool full of crap. Tarn has a comprehensive
test suite and we are committed to adding tests and fixing all bugs that are found.

Tarn will always remain simple.

## Install

```
npm install tarn
```

## Usage

```js
const { Pool, TimeoutError } = require('tarn');

const pool = new Pool({

  // function that creates a resource. You can either pass the resource
  // to the callback or return a promise that resolves the resource
  // (but not both).
  create: (cb) => {
    cb(null, new SomeResource());
  },

  // validates a connection before it is used. Return true or false
  // from it. If false is returned, the resource is destroyed and a
  // another one is acquired.
  validate: (resource) => {
    return true;
  },

  // function that destroys a resource. This is always synchronous
  // as nothing waits for the return value.
  destroy: (someResource) => {
    someResource.cleanup();
  },

  // minimum size
  min: 2,

  // maximum size
  max: 10,

  // acquire promises are rejected after this many milliseconds
  // if a resource cannot be acquired
  acquireTimeoutMillis: 30000,

  // create operations are cancelled after this many milliseconds
  // if a resource cannot be acquired
  createTimeoutMillis: 30000,

  // destroy operations are awaited for at most this many milliseconds
  // new resources will be created after this timeout
  destroyTimeoutMillis: 5000,

  // free resouces are destroyed after this many milliseconds
  idleTimeoutMillis: 30000,

  // how often to check for idle resources to destroy
  reapIntervalMillis: 1000,

  // long long to idle after failed create before trying again
  createRetryIntervalMillis: 200,

  // If true, when a create fails, the first pending acquire is
  // rejected with the error. If this is false (the default) then
  // create is retried until acquireTimeoutMillis milliseconds has
  // passed.
  propagateCreateError: false
});

// acquires a resource. The promise is rejected with `tarn.TimeoutError`
// after `acquireTimeoutMillis` if a resource could not be acquired.
const acquire = pool.acquire();

// acquire can be aborted using the abort method
acquire.abort();

// the acquire object has a promise property that gets reolved with
// the acquired resource
try {
  const resource = await acquire.promise;
} catch (err) {
  // if the acquire times out an error of class TimeoutError is thrown
  if (err instanceof TimeoutError) {
    console.log('timeout');
  }
}

// releases the resource.
pool.release(resource);

// returns the number of non-free resources
pool.numUsed()

// returns the number of free resources
pool.numFree()

// how many acquires are waiting for a resource to be released
pool.numPendingAcquires()

// how many asynchronous create calls are running
pool.numPendingCreates()

// waits for all resources to be returned to the pool and destroys them.
// pool cannot be used after this.
await pool.destroy();
```

## Changelog

### 1.1.5 2019-04-06 

- Added changelog #22
- Handle opt.destroy() being a promise with destroyTimeout #16
- Explicitly silence bluebird warnings #17
- Add strict typings via TypeScript #10
