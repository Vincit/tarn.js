[![Build Status](https://travis-ci.org/Vincit/tarn.js.svg?branch=master)](https://travis-ci.org/Vincit/tarn.js)

## Install

```
npm install tarn
```

## Usage:

```js
const Tarn = require('tarn').Tarn;

const pool = new Tarn({
  create: (cb) => {
    cb(null, new SomeResource());
  },
  destroy: (someResource) => {
    someResource.cleanup();
  },
  min: 2,
  max: 10,
  acquireTimeoutMs: 30000,
  createTimeoutMs: 30000,
  idleTimeoutMs: 30000,
  reapIntervalMs: 1000
});

pool.acquire().promise.then(someResource => {
  return useResource(someResource);
}).then(someResource => {
  pool.release(someResource);
});
```
