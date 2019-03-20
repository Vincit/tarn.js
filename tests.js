'use strict';

const Promise = require('bluebird');
const Pool = require('./').Pool;
const TimeoutError = require('./').TimeoutError;
const expect = require('expect.js');

describe('Tarn', () => {
  let pool = null;

  beforeEach(() => {
    pool = null;
  });

  afterEach(() => {
    if (pool) {
      // Stop the reaping loop.
      pool._stopReaping();
    }
  });

  describe('constructor', () => {
    it('should fail if no opt.create function is given', () => {
      expect(() => {
        pool = new Pool({
          destroy() {},
          min: 0,
          max: 1
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: opt.create function most be provided');
      });
    });

    it('should fail if no opt.destroy function is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          min: 0,
          max: 1
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: opt.destroy function most be provided');
      });
    });

    it('should fail if opt.min is missing', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          max: 1
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: opt.min must be an integer >= 0');
      });
    });

    it('should fail if a non-integer opt.min is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: '0',
          max: 1
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: opt.min must be an integer >= 0');
      });
    });

    it('should fail if a negative opt.min is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: -1,
          max: 1
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: opt.min must be an integer >= 0');
      });
    });

    it('should fail if opt.max is missing', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: 0
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: opt.max must be an integer > 0');
      });
    });

    it('should fail if a non-integer opt.max is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: 0,
          max: '1'
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: opt.max must be an integer > 0');
      });
    });

    it('should fail if a negative opt.max is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: 0,
          max: -1
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: opt.max must be an integer > 0');
      });
    });

    it('should fail if a zero opt.max is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: 0,
          max: 0
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: opt.max must be an integer > 0');
      });
    });

    it('should fail if opt.min > opt.max is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: 2,
          max: 1
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: opt.max is smaller than opt.min');
      });
    });

    it('should fail if a non-integer opt.acquireTimeoutMillis is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: 2,
          max: 10,
          acquireTimeoutMillis: '10'
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: invalid opt.acquireTimeoutMillis "10"');
      });
    });

    it('should fail if a negative opt.acquireTimeoutMillis is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: 2,
          max: 10,
          acquireTimeoutMillis: -10
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: invalid opt.acquireTimeoutMillis -10');
      });
    });

    it('should fail if a zero opt.acquireTimeoutMillis is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: 2,
          max: 10,
          acquireTimeoutMillis: 0
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: invalid opt.acquireTimeoutMillis 0');
      });
    });

    it('should fail if a non-integer opt.createTimeoutMillis is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: 2,
          max: 10,
          createTimeoutMillis: '10'
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: invalid opt.createTimeoutMillis "10"');
      });
    });

    it('should fail if a negative opt.createTimeoutMillis is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: 2,
          max: 10,
          createTimeoutMillis: -10
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: invalid opt.createTimeoutMillis -10');
      });
    });

    it('should fail if a zero opt.createTimeoutMillis is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: 2,
          max: 10,
          createTimeoutMillis: 0
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: invalid opt.createTimeoutMillis 0');
      });
    });

    it('should fail if a non-integer opt.destroyTimeoutMillis is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: 2,
          max: 10,
          destroyTimeoutMillis: '10'
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: invalid opt.destroyTimeoutMillis "10"');
      });
    });

    it('should fail if a negative opt.destroyTimeoutMillis is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: 2,
          max: 10,
          destroyTimeoutMillis: -10
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: invalid opt.destroyTimeoutMillis -10');
      });
    });

    it('should fail if a zero opt.destroyTimeoutMillis is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: 2,
          max: 10,
          destroyTimeoutMillis: 0
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: invalid opt.destroyTimeoutMillis 0');
      });
    });

    it('should fail if a non-integer opt.idleTimeoutMillis is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: 2,
          max: 10,
          idleTimeoutMillis: '10'
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: invalid opt.idleTimeoutMillis "10"');
      });
    });

    it('should fail if a negative opt.idleTimeoutMillis is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: 2,
          max: 10,
          idleTimeoutMillis: -10
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: invalid opt.idleTimeoutMillis -10');
      });
    });

    it('should fail if a zero opt.idleTimeoutMillis is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: 2,
          max: 10,
          idleTimeoutMillis: 0
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: invalid opt.idleTimeoutMillis 0');
      });
    });

    it('should fail if a non-integer opt.reapIntervalMillis is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: 2,
          max: 10,
          reapIntervalMillis: '10'
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: invalid opt.reapIntervalMillis "10"');
      });
    });

    it('should fail if a negative opt.reapIntervalMillis is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: 2,
          max: 10,
          reapIntervalMillis: -10
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: invalid opt.reapIntervalMillis -10');
      });
    });

    it('should fail if a zero opt.reapIntervalMillis is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: 2,
          max: 10,
          reapIntervalMillis: 0
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: invalid opt.reapIntervalMillis 0');
      });
    });

    it('should fail if a zero opt.createRetryIntervalMillis is given', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: 2,
          max: 10,
          createRetryIntervalMillis: 0
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: invalid opt.createRetryIntervalMillis 0');
      });
    });
  });

  describe('acquire', () => {
    it('should acquire opt.max resources (async creator)', () => {
      let createCalled = 0;
      let destroyCalled = 0;

      pool = new Pool({
        create(callback) {
          let a = createCalled++;

          setTimeout(() => {
            callback(null, { a });
          }, 10);
        },
        destroy() {
          ++destroyCalled;
        },
        min: 2,
        max: 4
      });

      const acquirePromise = Promise.all([
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise
      ]);

      expect(pool.numUsed()).to.equal(0);
      expect(pool.numFree()).to.equal(0);
      expect(pool.numPendingAcquires()).to.equal(4);
      expect(pool.numPendingCreates()).to.equal(4);

      return acquirePromise.then(res => {
        expect(sortBy(res, 'a')).to.eql([{ a: 0 }, { a: 1 }, { a: 2 }, { a: 3 }]);

        expect(createCalled).to.equal(4);
        expect(destroyCalled).to.equal(0);

        expect(pool.numUsed()).to.equal(4);
        expect(pool.numFree()).to.equal(0);
        expect(pool.numPendingAcquires()).to.equal(0);
        expect(pool.numPendingCreates()).to.equal(0);
      });
    });

    it('should acquire opt.max resources (promise creator)', () => {
      let createCalled = 0;
      let destroyCalled = 0;

      pool = new Pool({
        create() {
          return Promise.resolve({ a: createCalled++ }).delay(50);
        },
        destroy() {
          ++destroyCalled;
        },
        min: 2,
        max: 4
      });

      const acquirePromise = Promise.all([
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise
      ]);

      expect(pool.numUsed()).to.equal(0);
      expect(pool.numFree()).to.equal(0);
      expect(pool.numPendingAcquires()).to.equal(4);
      expect(pool.numPendingCreates()).to.equal(4);

      return acquirePromise.then(res => {
        expect(sortBy(res, 'a')).to.eql([{ a: 0 }, { a: 1 }, { a: 2 }, { a: 3 }]);

        expect(createCalled).to.equal(4);
        expect(destroyCalled).to.equal(0);

        expect(pool.numUsed()).to.equal(4);
        expect(pool.numFree()).to.equal(0);
        expect(pool.numPendingAcquires()).to.equal(0);
        expect(pool.numPendingCreates()).to.equal(0);
      });
    });

    it('should acquire opt.max resources (sync creator)', () => {
      let createCalled = 0;
      let destroyCalled = 0;

      pool = new Pool({
        create(callback) {
          callback(null, { a: createCalled++ });
        },
        destroy() {
          ++destroyCalled;
        },
        min: 2,
        max: 4
      });

      return Promise.all([
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise
      ]).then(res => {
        expect(sortBy(res, 'a')).to.eql([{ a: 0 }, { a: 1 }, { a: 2 }, { a: 3 }]);

        expect(createCalled).to.equal(4);
        expect(destroyCalled).to.equal(0);

        expect(pool.numUsed()).to.equal(4);
        expect(pool.numFree()).to.equal(0);
        expect(pool.numPendingAcquires()).to.equal(0);
        expect(pool.numPendingCreates()).to.equal(0);
      });
    });

    it('should retry a create if it fails', () => {
      let createCalled = 0;
      let destroyCalled = 0;

      pool = new Pool({
        create() {
          ++createCalled;

          if (createCalled === 1) {
            return Promise.reject(new Error('first time fails'));
          } else {
            return Promise.resolve({ a: 1 });
          }
        },
        destroy() {
          ++destroyCalled;
        },
        min: 2,
        max: 4,
        createRetryIntervalMillis: 10
      });

      return pool.acquire().promise.then(res => {
        expect(res).to.eql({ a: 1 });

        expect(createCalled).to.equal(2);
        expect(destroyCalled).to.equal(0);

        expect(pool.numUsed()).to.equal(1);
        expect(pool.numFree()).to.equal(0);
        expect(pool.numPendingAcquires()).to.equal(0);
        expect(pool.numPendingCreates()).to.equal(0);
      });
    });

    it('should acquire at max opt.max resources at a time', () => {
      let createCalled = 0;
      let releasesCalled = false;

      pool = new Pool({
        create(callback) {
          callback(null, { a: createCalled++ });
        },
        destroy() {},
        min: 0,
        max: 5
      });

      return Promise.all([
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise
      ]).then(res => {
        expect(sortBy(res, 'a')).to.eql([{ a: 0 }, { a: 1 }, { a: 2 }, { a: 3 }, { a: 4 }]);

        expect(createCalled).to.equal(5);
        expect(pool.numUsed()).to.equal(5);
        expect(pool.numFree()).to.equal(0);
        expect(pool.numPendingAcquires()).to.equal(0);
        expect(pool.numPendingCreates()).to.equal(0);

        let newAcquires = [pool.acquire().promise, pool.acquire().promise, pool.acquire().promise];

        expect(pool.numPendingAcquires()).to.equal(3);

        setTimeout(() => {
          pool.release(res[2]);
          pool.release(res[3]);
          pool.release(res[4]);
          releasesCalled = true;
        }, 100);

        return Promise.all(newAcquires).then(newRes => {
          expect(releasesCalled).to.equal(true);

          expect(newRes[0] === res[2]).to.equal(true);
          expect(newRes[1] === res[3]).to.equal(true);
          expect(newRes[2] === res[4]).to.equal(true);

          expect(createCalled).to.equal(5);
          expect(pool.numUsed()).to.equal(5);
          expect(pool.numFree()).to.equal(0);
          expect(pool.numPendingAcquires()).to.equal(0);
          expect(pool.numPendingCreates()).to.equal(0);
        });
      });
    });

    it('should abort an acquire if abort() is called for the return value from the `acquire` method', done => {
      let createCalled = 0;
      let destroyCalled = 0;

      pool = new Pool({
        create(callback) {
          const a = createCalled++;

          setTimeout(() => {
            callback(null, { a });
          }, 50);
        },
        destroy() {
          ++destroyCalled;
        },
        min: 2,
        max: 4
      });

      let acquire = pool.acquire();
      expect(pool.numPendingCreates()).to.equal(1);

      setTimeout(() => {
        acquire.abort();
      }, 10);

      acquire.promise
        .then(() => {
          done(new Error('should not get here'));
        })
        .catch(err => {
          expect(err.message).to.equal('aborted');

          expect(createCalled).to.equal(1);

          expect(pool.numUsed()).to.equal(0);
          expect(pool.numFree()).to.equal(0);
          expect(pool.numPendingAcquires()).to.equal(0);
          expect(pool.numPendingCreates()).to.equal(1);

          return Promise.delay(100).then(() => {
            expect(createCalled).to.equal(1);
            expect(destroyCalled).to.equal(0);

            expect(pool.numUsed()).to.equal(0);
            expect(pool.numFree()).to.equal(1);
            expect(pool.numPendingAcquires()).to.equal(0);

            done();
          });
        })
        .catch(done);
    });

    it('should validate resources using opt.validate before acquiring', () => {
      let createCalled = 0;
      let destroyCalled = 0;
      let destroyed = null;

      pool = new Pool({
        create(callback) {
          callback(null, { a: createCalled++, n: 0 });
        },
        validate(resource) {
          return resource.a !== 0 || resource.n === 0;
        },
        destroy(resource) {
          ++destroyCalled;
          destroyed = resource;
        },
        min: 0,
        max: 2
      });

      return Promise.all([acquire(), acquire()])
        .then(res => {
          expect(sortBy(res, 'a')).to.eql([{ a: 0, n: 1 }, { a: 1, n: 1 }]);

          expect(createCalled).to.equal(2);
          expect(destroyCalled).to.equal(0);
          expect(pool.numUsed()).to.equal(2);
          expect(pool.numFree()).to.equal(0);
          expect(pool.numPendingAcquires()).to.equal(0);
          expect(pool.numPendingCreates()).to.equal(0);

          pool.release(res[0]);
          pool.release(res[1]);

          return Promise.all([acquire(), acquire()]);
        })
        .then(res => {
          expect(res).to.eql([{ a: 1, n: 2 }, { a: 2, n: 1 }]);

          expect(createCalled).to.equal(3);
          expect(destroyCalled).to.equal(1);
          expect(destroyed).to.eql({ a: 0, n: 1 });
          expect(pool.numUsed()).to.equal(2);
          expect(pool.numFree()).to.equal(0);
          expect(pool.numPendingAcquires()).to.equal(0);
          expect(pool.numPendingCreates()).to.equal(0);
        });

      function acquire() {
        return pool.acquire().promise.then(resource => {
          ++resource.n;
          return resource;
        });
      }
    });
  });

  describe('release', () => {
    it('release should release a resource', () => {
      let createCalled = 0;

      pool = new Pool({
        create(callback) {
          let a = createCalled++;

          setTimeout(() => {
            callback(null, { a: a });
          }, 10);
        },
        destroy() {},
        min: 2,
        max: 4
      });

      return Promise.all([pool.acquire().promise, pool.acquire().promise, pool.acquire().promise])
        .then(res => {
          expect(sortBy(res, 'a')).to.eql([{ a: 0 }, { a: 1 }, { a: 2 }]);

          expect(createCalled).to.equal(3);
          expect(pool.numUsed()).to.equal(3);
          expect(pool.numFree()).to.equal(0);
          expect(pool.numPendingAcquires()).to.equal(0);
          expect(pool.numPendingCreates()).to.equal(0);

          pool.release(res[2]);
          pool.release(res[1]);

          expect(createCalled).to.equal(3);
          expect(pool.numUsed()).to.equal(1);
          expect(pool.numFree()).to.equal(2);
          expect(pool.numPendingAcquires()).to.equal(0);
          expect(pool.numPendingCreates()).to.equal(0);

          return Promise.all([
            pool.acquire().promise,
            pool.acquire().promise,
            pool.acquire().promise
          ]);
        })
        .then(res => {
          expect(res).to.eql([{ a: 1 }, { a: 2 }, { a: 3 }]);

          expect(createCalled).to.equal(4);
          expect(pool.numUsed()).to.equal(4);
          expect(pool.numFree()).to.equal(0);
          expect(pool.numPendingAcquires()).to.equal(0);
          expect(pool.numPendingCreates()).to.equal(0);
        });
    });

    it('should acquire pending acquires after release', () => {
      let createCalled = 0;
      let releaseCalled = false;

      pool = new Pool({
        create(callback) {
          let a = createCalled++;

          setTimeout(() => {
            callback(null, { a: a });
          }, 1);
        },
        destroy() {},
        min: 0,
        max: 2
      });

      return Promise.all([pool.acquire().promise, pool.acquire().promise])
        .then(res => {
          let pendingAcquire = pool.acquire();

          expect(createCalled).to.equal(2);
          expect(pool.numUsed()).to.equal(2);
          expect(pool.numFree()).to.equal(0);
          expect(pool.numPendingAcquires()).to.equal(1);
          expect(pool.numPendingCreates()).to.equal(0);

          setTimeout(() => {
            releaseCalled = true;
            pool.release(findBy(res, 'a', 1));
          }, 100);

          return pendingAcquire.promise;
        })
        .then(res => {
          expect(res).to.eql({ a: 1 });
          expect(releaseCalled).to.equal(true);
        });
    });

    it('should ignore unknown resources', () => {
      let createCalled = 0;
      let destroyCalled = 0;

      pool = new Pool({
        create(callback) {
          let a = createCalled++;

          setTimeout(() => {
            callback(null, { a: a });
          }, 1);
        },
        destroy() {
          ++destroyCalled;
        },
        min: 0,
        max: 2
      });

      return Promise.all([pool.acquire().promise, pool.acquire().promise]).then(res => {
        expect(sortBy(res, 'a')).to.eql([{ a: 0 }, { a: 1 }]);

        // These should do nothing, since the resources are not referentially equal.
        pool.release({ a: 0 });
        pool.release({ a: 1 });
        pool.release({});

        expect(createCalled).to.equal(2);
        expect(destroyCalled).to.equal(0);
        expect(pool.numUsed()).to.equal(2);
        expect(pool.numFree()).to.equal(0);
        expect(pool.numPendingAcquires()).to.equal(0);
        expect(pool.numPendingCreates()).to.equal(0);
      });
    });
  });

  describe('destroy', () => {
    it('should wait for all creates to finish, and resources to be returned to the pool', () => {
      let releaseCalled = false;
      let destroyCalled = 0;
      let createCalled = 0;
      let abortCalled = false;

      pool = new Pool({
        create: () => {
          ++createCalled;
          return Promise.delay(50).return({});
        },
        destroy() {
          ++destroyCalled;
        },
        min: 0,
        max: 10
      });

      return Promise.all([pool.acquire().promise, pool.acquire().promise])
        .then(res => {
          // Release before the create from the acquire is ready.
          setTimeout(() => {
            pool.release(res[0]);
          }, 10);

          pool
            .acquire()
            .promise.then(() => {
              throw new Error('should not get here since the creation takes 50 ms');
            })
            .catch(err => {
              expect(err.message).to.equal('aborted');
              // destroy should abort
              abortCalled = true;
            });

          // Release after the create from the acquire is ready.
          setTimeout(() => {
            pool.release(res[1]);
            releaseCalled = true;
          }, 100);

          return pool.destroy();
        })
        .then(() => {
          expect(abortCalled).to.equal(true);
          expect(releaseCalled).to.equal(true);

          expect(createCalled).to.equal(3);
          expect(destroyCalled).to.equal(3);

          expect(pool.numUsed()).to.equal(0);
          expect(pool.numFree()).to.equal(0);
          expect(pool.numPendingAcquires()).to.equal(0);
          expect(pool.numPendingCreates()).to.equal(0);
        });
    });

    it('should wait asynchronously for all creates to finish, and resources to be returned to the pool', () => {
      let releaseCalled = false;
      let destroyCalled = 0;
      let createCalled = 0;
      let abortCalled = false;

      pool = new Pool({
        create: () => {
          ++createCalled;
          return Promise.delay(50).return({});
        },
        destroy() {
          ++destroyCalled;
          return Promise.delay(200);
        },
        min: 0,
        max: 10
      });

      return Promise.all([pool.acquire().promise, pool.acquire().promise])
        .then(res => {
          // Release before the create from the acquire is ready.
          setTimeout(() => {
            pool.release(res[0]);
          }, 10);

          pool
            .acquire()
            .promise.then(() => {
              throw new Error('should not get here since the creation takes 50 ms');
            })
            .catch(err => {
              expect(err.message).to.equal('aborted');
              // destroy should abort
              abortCalled = true;
            });

          // Release after the create from the acquire is ready.
          setTimeout(() => {
            pool.release(res[1]);
            releaseCalled = true;
          }, 100);

          return pool.destroy();
        })
        .then(() => {
          expect(abortCalled).to.equal(true);
          expect(releaseCalled).to.equal(true);

          expect(createCalled).to.equal(3);
          expect(destroyCalled).to.equal(3);

          expect(pool.numUsed()).to.equal(0);
          expect(pool.numFree()).to.equal(0);
          expect(pool.numPendingAcquires()).to.equal(0);
          expect(pool.numPendingCreates()).to.equal(0);
        });
    });

    it('should log an error if a sync error is thrown', () => {
      let destroyerErrorThrown = false;
      pool = new Pool({
        create() {
          return {id: 1};
        },
        destroy() {
          throw new Error('destroy error');
        },
        log(msg) {
          if (msg.includes('destroy error')) {
            destroyerErrorThrown = true;
          }
        },
        min: 0,
        max: 10,
      });

      return pool.acquire().promise.then(resource => {
          pool.release(resource);
        })
        .then(() => {
          return pool.destroy();
        })
        .then(() => {
          expect(destroyerErrorThrown).to.equal(true);
        });
    });

    it('should log an error if an async error is thrown', () => {
      let destroyerErrorThrown = false;
      pool = new Pool({
        create() {
          return {id: 1};
        },
        destroy() {
          return Promise.reject(new Error('destroy error'));
        },
        log(msg) {
          if (msg.includes('destroy error')) {
            destroyerErrorThrown = true;
          }
        },
        min: 0,
        max: 10,
      });

      return pool.acquire().promise.then(resource => {
          pool.release(resource);
        })
        .then(() => {
          return pool.destroy();
        })
        .then(() => {
          expect(destroyerErrorThrown).to.equal(true);
        });
    });

    it('should not hang if the async destroy is too slow', () => {
      let destroyTimeoutMillis = 100;
      let destroyerErrorThrown = false;
      pool = new Pool({
        create() {
          return {id: 1};
        },
        destroy() {
          return new Promise((resolve) => {
            setTimeout(resolve, destroyTimeoutMillis * 2);
          })
        },
        log(msg) {
          if (msg.includes('resource destroyer') && msg.includes('operation timed')) {
            destroyerErrorThrown = true;
          }
        },
        min: 0,
        max: 10,
        destroyTimeoutMillis: destroyTimeoutMillis,
      });

      return pool.acquire().promise.then(resource => {
          pool.release(resource);
        })
        .then(() => {
          return pool.destroy();
        })
        .then(() => {
          console.log('abc')
          expect(destroyerErrorThrown).to.equal(true);
        });
    });  });

  describe('acquireTimeout', () => {
    it('should fail to acquire opt.max + 1 resources after acquireTimeoutMillis', done => {
      let createCalled = 0;
      let acquireTimeoutMillis = 100;

      pool = new Pool({
        create(callback) {
          let a = createCalled++;

          setTimeout(() => {
            callback(null, { a: a });
          }, 10);
        },
        destroy() {},
        min: 2,
        max: 5,
        acquireTimeoutMillis: acquireTimeoutMillis
      });

      let now = Date.now();

      Promise.all([
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise
      ])
        .then(() => {
          done(new Error('should not get here'));
        })
        .catch(err => {
          let duration = Date.now() - now;

          expect(err).to.be.a(TimeoutError);

          expect(duration).to.be.greaterThan(acquireTimeoutMillis - 5);
          expect(duration - acquireTimeoutMillis).to.be.lessThan(50);

          expect(createCalled).to.equal(5);
          expect(pool.numUsed()).to.equal(5);
          expect(pool.numFree()).to.equal(0);
          expect(pool.numPendingAcquires()).to.equal(0);
          expect(pool.numPendingCreates()).to.equal(0);

          done();
        })
        .catch(done);
    });

    it('should recover after acquireTimeoutMillis if the create function returns an error', done => {
      let createCalled = 0;
      let acquireTimeoutMillis = 100;

      pool = new Pool({
        create(callback) {
          ++createCalled;

          setTimeout(() => {
            callback(new Error('this is the error from create'));
          }, 10);
        },
        destroy() {},
        min: 2,
        max: 4,
        acquireTimeoutMillis: acquireTimeoutMillis,
        createRetryIntervalMillis: 200
      });

      let now = Date.now();

      pool
        .acquire()
        .promise.then(() => {
          done(new Error('should not get here'));
        })
        .catch(err => {
          let duration = Date.now() - now;

          expect(err).to.be.a(TimeoutError);
          expect(err.message).to.equal('this is the error from create');

          expect(duration).to.be.greaterThan(acquireTimeoutMillis - 5);
          expect(duration - acquireTimeoutMillis).to.be.lessThan(50);

          expect(createCalled).to.equal(1);
          expect(pool.numUsed()).to.equal(0);
          expect(pool.numFree()).to.equal(0);
          expect(pool.numPendingAcquires()).to.equal(0);
          expect(pool.numPendingCreates()).to.equal(0);

          done();
        })
        .catch(done);
    });

    it('should recover after acquireTimeoutMillis if the create function throws an error', done => {
      let createCalled = 0;
      let acquireTimeoutMillis = 100;

      pool = new Pool({
        create() {
          ++createCalled;
          throw new Error('this is the error from create');
        },
        destroy() {},
        min: 2,
        max: 4,
        acquireTimeoutMillis: acquireTimeoutMillis
      });

      let now = Date.now();

      pool
        .acquire()
        .promise.then(() => {
          done(new Error('should not get here'));
        })
        .catch(err => {
          let duration = Date.now() - now;

          expect(err).to.be.a(TimeoutError);
          expect(err.message).to.equal('this is the error from create');

          expect(duration).to.be.greaterThan(acquireTimeoutMillis - 5);
          expect(duration - acquireTimeoutMillis).to.be.lessThan(50);

          expect(createCalled).to.equal(1);
          expect(pool.numUsed()).to.equal(0);
          expect(pool.numFree()).to.equal(0);
          expect(pool.numPendingAcquires()).to.equal(0);
          expect(pool.numPendingCreates()).to.equal(0);

          done();
        })
        .catch(done);
    });
  });

  describe('propagateCreateError', () => {
    it('should immediately reject the first acquire in the queue if create throws an error', done => {
      let createCalled = 0;
      let acquireTimeoutMillis = 1000;

      pool = new Pool({
        create(callback) {
          createCalled++;

          if (createCalled === 1) {
            return Promise.reject(new Error('create fail'));
          } else {
            return Promise.resolve({ value: createCalled });
          }
        },
        destroy() {},
        min: 2,
        max: 5,
        acquireTimeoutMillis: acquireTimeoutMillis,
        propagateCreateError: true
      });

      let now = Date.now();

      Promise.resolve(pool.acquire().promise)
        .reflect()
        .then(res1 => {
          return Promise.resolve(pool.acquire().promise)
            .reflect()
            .then(res2 => [res1, res2]);
        })
        .spread((res1, res2) => {
          let duration = Date.now() - now;

          expect(res1.isRejected()).to.equal(true);
          expect(res1.reason()).to.not.be.a(TimeoutError);
          expect(res1.reason().message).to.equal('create fail');

          expect(res2.isFulfilled()).to.equal(true);
          expect(res2.value()).to.eql({ value: 2 });

          // duration to fail should be significantly smaller than the acquireTimeoutMillis.
          expect(duration).to.be.lessThan(acquireTimeoutMillis - 500);

          expect(createCalled).to.equal(2);
          expect(pool.numUsed()).to.equal(1);
          expect(pool.numFree()).to.equal(0);
          expect(pool.numPendingAcquires()).to.equal(0);
          expect(pool.numPendingCreates()).to.equal(0);

          done();
        })
        .catch(done);
    });
  });

  describe('idleTimeoutMillis', () => {
    it('should remove idle resources after idleTimeoutMillis', done => {
      let createCalled = 0;
      let destroyCalled = 0;
      let destroyed = [];

      pool = new Pool({
        create(callback) {
          let a = createCalled++;

          setTimeout(() => {
            callback(null, { a: a });
          }, 10);
        },
        destroy(resource) {
          ++destroyCalled;
          destroyed.push(resource);
        },
        min: 0,
        max: 4,
        idleTimeoutMillis: 100,
        reapIntervalMillis: 10
      });

      Promise.all([pool.acquire().promise, pool.acquire().promise, pool.acquire().promise])
        .then(res => {
          expect(sortBy(res, 'a')).to.eql([{ a: 0 }, { a: 1 }, { a: 2 }]);

          expect(pool.numUsed()).to.equal(3);
          expect(pool.numFree()).to.equal(0);

          pool.release(res[0]);
          pool.release(res[1]);

          expect(destroyCalled).to.equal(0);
          expect(pool.numUsed()).to.equal(1);
          expect(pool.numFree()).to.equal(2);

          return Promise.delay(50);
        })
        .then(() => {
          expect(destroyCalled).to.equal(0);
          expect(pool.numUsed()).to.equal(1);
          expect(pool.numFree()).to.equal(2);

          return Promise.delay(60);
        })
        .then(() => {
          expect(destroyed).to.eql([{ a: 0 }, { a: 1 }]);

          expect(destroyCalled).to.equal(2);
          expect(pool.numUsed()).to.equal(1);
          expect(pool.numFree()).to.equal(0);

          done();
        })
        .catch(done);
    });

    it('should only run the reaping loop when there is something to reap', done => {
      let createCalled = 0;
      let destroyCalled = 0;
      let destroyed = [];

      pool = new Pool({
        create(callback) {
          let a = createCalled++;

          setTimeout(() => {
            callback(null, { a: a });
          }, 10);
        },
        destroy(resource) {
          ++destroyCalled;
          destroyed.push(resource);
        },
        min: 0,
        max: 4,
        idleTimeoutMillis: 100,
        reapIntervalMillis: 10
      });

      expect(pool.interval).to.equal(null);

      pool
        .acquire()
        .promise.then(res => {
          expect(pool.interval).to.not.equal(null);
          pool.release(res);
          return Promise.delay(50);
        })
        .then(() => {
          expect(pool.interval).to.not.equal(null);
          return Promise.delay(60);
        })
        .then(() => {
          expect(pool.interval).to.equal(null);
          expect(destroyed).to.eql([{ a: 0 }]);

          // Should restart the reaping loop again.
          return pool.acquire().promise;
        })
        .then(res => {
          expect(pool.interval).to.not.equal(null);
          expect(res).to.eql({ a: 1 });

          done();
        })
        .catch(done);
    });

    it('should always keep opt.min resources', done => {
      let createCalled = 0;
      let destroyCalled = 0;
      let destroyed = [];

      pool = new Pool({
        create(callback) {
          let a = createCalled++;

          setTimeout(() => {
            callback(null, { a: a });
          }, 10);
        },
        destroy(resource) {
          ++destroyCalled;
          destroyed.push(resource);
        },
        min: 2,
        max: 4,
        idleTimeoutMillis: 100,
        reapIntervalMillis: 10
      });

      Promise.all([
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise
      ])
        .then(res => {
          expect(sortBy(res, 'a')).to.eql([{ a: 0 }, { a: 1 }, { a: 2 }, { a: 3 }]);

          expect(pool.numUsed()).to.equal(4);
          expect(pool.numFree()).to.equal(0);

          pool.release(findBy(res, 'a', 0));
          pool.release(findBy(res, 'a', 1));
          pool.release(findBy(res, 'a', 2));

          expect(destroyCalled).to.equal(0);
          expect(pool.numUsed()).to.equal(1);
          expect(pool.numFree()).to.equal(3);

          return Promise.delay(50);
        })
        .then(() => {
          expect(destroyCalled).to.equal(0);
          expect(pool.numUsed()).to.equal(1);
          expect(pool.numFree()).to.equal(3);

          return Promise.delay(60);
        })
        .then(() => {
          expect(sortBy(destroyed, 'a')).to.eql([{ a: 0 }, { a: 1 }]);

          expect(destroyCalled).to.equal(2);
          expect(pool.numUsed()).to.equal(1);
          expect(pool.numFree()).to.equal(1);

          done();
        })
        .catch(done);
    });

    it('should release unused resources after idleTimeoutMillis when resources are repeatedly released and freed', done => {
      let createCalled = 0;
      let destroyCalled = 0;
      let destroyed = [];
      let finished = false;

      pool = new Pool({
        create(callback) {
          let a = createCalled++;

          setTimeout(() => {
            callback(null, { a: a });
          }, 10);
        },
        destroy(resource) {
          ++destroyCalled;
          destroyed.push(resource);
        },
        min: 0,
        max: 4,
        idleTimeoutMillis: 100,
        reapIntervalMillis: 10
      });

      Promise.all([
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise
      ])
        .then(res => {
          pool.release(res[0]);
          pool.release(res[1]);

          // Start two threads that first release a resource and then acquire it again.
          // Since we only use max 2 resources at a time, the two others hould get
          // destroyed after idleTimeoutMillis
          releaseAndAcquireThread(res[2]);
          releaseAndAcquireThread(res[3]);

          function releaseAndAcquireThread(res) {
            if (finished) return;
            pool.release(res);

            return Promise.delay(rand())
              .then(() => {
                if (finished) return;
                return pool.acquire().promise;
              })
              .then(res => {
                if (finished) return;
                return Promise.delay(rand()).then(() => {
                  return releaseAndAcquireThread(res);
                });
              });
          }

          function rand() {
            return Math.round(1 + Math.random() * 4);
          }

          return Promise.delay(200);
        })
        .then(() => {
          finished = true;

          expect(createCalled).to.equal(4);
          expect(destroyCalled).to.equal(2);
          expect(pool.numFree() + pool.numUsed()).to.equal(2);
          done();
        })
        .catch(err => {
          finished = true;
          done(err);
        });
    });
  });

  describe('randomized tests', () => {
    const NUM_RANDOM_TESTS = 0;

    for (let rndIdx = 1; rndIdx < NUM_RANDOM_TESTS + 1; ++rndIdx) {
      const maxResources = 10 + randInt(90);
      const minResources = randInt(10);
      const numActions = 50 + randInt(400);
      const maxAcquireDelay = randInt(800);
      const maxCreateDelay = randInt(200);
      const maxReleaseDelay = randInt(100);

      const reapIntervalMillis = 5 + randInt(95);
      const idleTimeoutMillis = 5 + randInt(95);

      const createFailProp = Math.random() * 0.7;
      const destroyFailProp = Math.random() * 0.7;
      const validateFailProp = Math.random() * 0.5;

      it(`random ${rndIdx}`, function() {
        this.timeout(1000000);
        let id = 0;

        const usedResources = [];
        const createdResources = [];
        const destroyedResources = [];

        pool = new Pool({
          create() {
            const delay = Promise.delay(randInt(maxCreateDelay));

            if (Math.random() < createFailProp) {
              return delay.then(() => Promise.reject(new Error('create error')));
            } else {
              const resource = { id: ++id };
              createdResources.push(resource);
              return delay.then(() => resource);
            }
          },

          destroy(resource) {
            destroyedResources.push(resource);

            if (Math.random() < destroyFailProp) {
              throw new Error('destroy error ' + createIdx);
            }
          },

          validate(resource) {
            return Math.random() > validateFailProp;
          },

          min: minResources,
          max: maxResources,
          reapIntervalMillis,
          idleTimeoutMillis
        });

        const actions = [];

        for (let i = 0; i < numActions; ++i) {
          actions.push(() => {
            return Promise.delay(randInt(maxAcquireDelay))
              .then(() => pool.acquire().promise)
              .then(resource => {
                expect(usedResources.includes(resource)).to.equal(false);
                expect(pool.numUsed() + pool.numFree()).to.be.lessThan(maxResources + 1);

                usedResources.push(resource);
                return Promise.delay(randInt(maxReleaseDelay)).return(resource);
              })
              .then(resource => {
                usedResources.splice(usedResources.indexOf(resource), 1);
                pool.release(resource);
              });
          });
        }

        return Promise.map(actions, action => action())
          .then(() => {
            expect(pool.numUsed()).to.equal(0);
            expect(pool.numFree()).to.be.lessThan(maxResources + 1);

            return pool.destroy();
          })
          .then(() => {
            expect(createdResources.length).to.equal(destroyedResources.length);
            expect(createdResources.every(it => destroyedResources.includes(it)));
          });
      });
    }

    function randInt(max) {
      return Math.round(Math.random() * max);
    }
  });
});

function sortBy(arr, key) {
  return arr.sort((x1, x2) => {
    if (x1[key] === x2[key]) {
      return 0;
    } else if (x1[key] < x2[key]) {
      return -1;
    } else {
      return 1;
    }
  });
}

function findBy(arr, key, value) {
  for (let i = 0, l = arr.length; i < l; ++i) {
    if (arr[i][key] === value) {
      return arr[i];
    }
  }

  return null;
}
