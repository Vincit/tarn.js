[![Build Status](https://travis-ci.org/Vincit/tarn.js.svg?branch=master)](https://travis-ci.org/Vincit/tarn.js)

## Why yet another pool for node?

Tarn is focused in robustness and ability to recover from errors. Tarn has timeouts for all operations
that can fail or timeout so that you should never end up with pool full of crap. Tarn has a comprehensive
test suite and we are committed to adding tests and fixing all bugs that are found.

Tarn will always remain simple.

## Install

```
npm install tarn
```

## Usage:

```js
const Tarn = require('tarn').Tarn;

const pool = new Tarn({

  // function that creates a resource
  create: (cb) => {
    cb(null, new SomeResource());
  },
  
  // function that destroys a resource
  destroy: (someResource) => {
    someResource.cleanup();
  },
  
  // minimum size
  min: 2,
  
  // maximum size
  max: 10,
  
  // acquire promises are rejected after this many milliseconds
  // if a resource cannot be acquired
  acquireTimeoutMs: 30000,
  
  // create operations are cancelled after this many milliseconds
  // if a resource cannot be acquired
  createTimeoutMs: 30000,
  
  // free resouces are destroyed after this many milliseconds
  idleTimeoutMs: 30000,
  
  // how often to check for idle resources to destroy
  reapIntervalMs: 1000
});

pool.acquire().promise.then(someResource => {
  return useResource(someResource);
}).then(someResource => {
  pool.release(someResource);
});

// returns the number of non-free resources
pool.numUsed()

// returns the number of free resources
pool.numFree()

// how many acquires are waiting for a resource to be released
pool.numPendingAcquires()

// how many asynchronous create calls are running
pool.numPendingCreates()
```
