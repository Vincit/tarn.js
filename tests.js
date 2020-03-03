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

    it('should fail if unknown option passed', () => {
      expect(() => {
        pool = new Pool({
          create: () => {},
          destroy() {},
          min: 2,
          max: 10,
          imUnreal: undefined
        });
      }).to.throwException(err => {
        expect(err.message).to.equal('Tarn: unsupported option opt.imUnreal');
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
          expect(sortBy(res, 'a')).to.eql([
            { a: 0, n: 1 },
            { a: 1, n: 1 }
          ]);

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
          expect(res).to.eql([
            { a: 1, n: 2 },
            { a: 2, n: 1 }
          ]);

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
          return { id: 1 };
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
        max: 10
      });

      return pool
        .acquire()
        .promise.then(resource => {
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
          return { id: 1 };
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
        max: 10
      });

      return pool
        .acquire()
        .promise.then(resource => {
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
          return { id: 1 };
        },
        destroy() {
          return new Promise(resolve => {
            setTimeout(resolve, destroyTimeoutMillis * 2);
          });
        },
        log(msg) {
          if (msg.includes('resource destroyer') && msg.includes('operation timed')) {
            destroyerErrorThrown = true;
          }
        },
        min: 0,
        max: 10,
        destroyTimeoutMillis: destroyTimeoutMillis
      });

      return pool
        .acquire()
        .promise.then(resource => {
          pool.release(resource);
        })
        .then(() => {
          return pool.destroy();
        })
        .then(() => {
          expect(destroyerErrorThrown).to.equal(true);
        });
    });

    it('should wait for all resource destroys to finish before returning', () => {
      let destroyDelay = 200;
      pool = new Pool({
        create: () => {
          return Promise.resolve({});
        },
        destroy(res) {
          destroyDelay -= 50;
          return Promise.delay(destroyDelay).then(() => {
            res.destroyed = true;
          });
        },
        reapIntervalMillis: 10,
        idleTimeoutMillis: 1,
        min: 0,
        max: 10
      });

      return Promise.all([
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise
      ])
        .then(resources => {
          pool.release(resources[0]);
          pool.release(resources[1]);
          pool.release(resources[2]);
          pool.release(resources[3]);

          // reaping should have started destroying these resources already
          return Promise.delay(30).then(() => resources);
        })
        .then(resources => {
          // pool destroy should wait that all destroys are completed
          return pool.destroy().then(() => resources);
        })
        .then(resources => {
          expect(resources[0].destroyed).to.be.ok();
          expect(resources[1].destroyed).to.be.ok();
          expect(resources[2].destroyed).to.be.ok();
          expect(resources[3].destroyed).to.be.ok();
        });
    });
  });

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

          return Promise.delay(65);
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
          return Promise.delay(65);
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

  describe('event handler tests', () => {
    it('simple cases should work', async () => {
      const eventStats = {};
      let createCalled = 0;
      let destroyCalled = 0;

      pool = new Pool({
        // third create should fail
        create() {
          if (createCalled > 1) {
            return Promise.delay(10).then(() => Promise.reject(new Error('fail')));
          }
          return Promise.delay(10).then(() => Promise.resolve({ a: ++createCalled }));
        },

        // second destory should fail
        destroy(resource) {
          if (destroyCalled > 0) {
            return Promise.delay(10).then(() => Promise.reject(new Error('fail')));
          }
          ++destroyCalled;
          return Promise.delay(10).then(() => Promise.resolve());
        },
        min: 0,
        max: 3,
        propagateCreateError: true
      });

      // record resources lifespan and sort events by eventId or event name for those
      // which are not yet bound to resource
      function recordEvents(event) {
        pool.on(event, (first, second, ...args) => {
          if (!first) {
            // global event without arguments
            eventStats[event] = eventStats[event] || [];
            eventStats[event].push([event]);
            return;
          }

          // take id from resource (first, or second parameter) or from first eventId parameter
          const eventId = first.eventId || (second && second.eventId) || first;

          // if second parameter is resource without event ID
          // add add original eventId to it
          if (second && second.a && !second.eventId) {
            second.eventId = eventId;
          }

          // group events of record events of single resource
          eventStats[eventId] = eventStats[eventId] || [];
          eventStats[eventId].push([event, first, second, ...args]);
        });
      }

      recordEvents('acquireRequest');
      recordEvents('acquireSuccess');
      recordEvents('acquireFail');

      recordEvents('release');

      recordEvents('createRequest');
      recordEvents('createSuccess');
      recordEvents('createFail');

      recordEvents('destroyRequest');
      recordEvents('destroySuccess');
      recordEvents('destroyFail');

      recordEvents('startReaping');
      recordEvents('stopReaping');

      recordEvents('poolDestroyRequest');
      recordEvents('poolDestroySuccess');

      const pendingResource1 = pool.acquire();
      const pendingResource2 = pool.acquire();
      const resource1 = await pendingResource1.promise;
      const resource2 = await pendingResource2.promise;

      // reaping should have started once by now
      expect(eventStats['startReaping']).to.have.length(1);
      expect(eventStats['stopReaping']).to.be.undefined;

      const pendingResource3 = pool.acquire();
      const failed = await pendingResource3.promise.catch(() => 'did fail');
      expect(failed).to.equal('did fail');

      pool.release(resource1);
      pool.release(resource2);
      await pool.destroy();

      expect(eventStats['startReaping']).to.have.length(1);
      expect(eventStats['stopReaping']).to.have.length(1);

      const resource1Events = eventStats[resource1.eventId];
      const resource1AcquireRequestId = resource1Events.find(event => {
        return event[0].includes('acquire');
      })[1];

      const resource2Events = eventStats[resource2.eventId];
      const resource2AcquireRequestId = resource2Events.find(event => {
        return event[0].includes('acquire');
      })[1];

      // acquire request events were also emitted for resources
      const resource1AcquireRequest = eventStats[resource1AcquireRequestId][0];
      const resource2AcquireRequest = eventStats[resource2AcquireRequestId][0];
      expect(resource1AcquireRequest[0]).to.be('acquireRequest');
      expect(resource2AcquireRequest[0]).to.be('acquireRequest');

      // destroying one of resources should have failed
      const resource1HasFailedDestroy = resource1Events.includes(event => {
        return event[1] === 'destroyFailed';
      });

      const resource2HasFailedDestroy = resource2Events.includes(event => {
        return event[1] === 'destroyFailed';
      });

      expect(resource1HasFailedDestroy || resource2HasFailedDestroy).to.be.true;
      expect(resource1HasFailedDestroy && resource2HasFailedDestroy).to.be.false;

      // event ids for request and results match and event arguments too
      expect(resource1Events).to.have.length(6);
      expect(resource2Events).to.have.length(6);

      function filterEvents(eventArray, prefix) {
        return eventArray.filter(event => {
          return event[0].includes(prefix);
        });
      }

      // check that event pair has same eventId to be able to connect request and result
      function verifyPair(events) {
        expect(events).to.have.length(2);
        expect(events[0][1]).to.equal(events[1][1]);
      }

      verifyPair(filterEvents([resource1AcquireRequest, ...resource1Events], 'acquire'));
      verifyPair(filterEvents([resource2AcquireRequest, ...resource2Events], 'acquire'));
      verifyPair(filterEvents(resource1Events, 'create'));
      verifyPair(filterEvents(resource2Events, 'create'));
      verifyPair(filterEvents(resource1Events, 'destroy'));
      verifyPair(filterEvents(resource2Events, 'destroy'));

      // should have one acquire failure
      const acquireFailures = Object.values(eventStats).filter(events => {
        return (
          events.length === 2 && events[0][0] === 'acquireRequest' && events[1][0] === 'acquireFail'
        );
      });

      const createFailures = Object.values(eventStats).filter(events => {
        return (
          events.length === 2 && events[0][0] === 'createRequest' && events[1][0] === 'createFail'
        );
      });

      // should have one aqcuire and one create failure
      expect(acquireFailures).to.have.length(1);
      expect(createFailures).to.have.length(1);

      // should have pool destroy events
      const poolDestroy = Object.values(eventStats).filter(events => {
        return (
          events.length === 2 &&
          events[0][0] === 'poolDestroyRequest' &&
          events[1][0] === 'poolDestroySuccess'
        );
      });
      expect(poolDestroy).to.have.length(1);

      // should have no extra events
      const allEvents = [].concat(...Object.values(eventStats));
      expect(allEvents).to.have.length(22);

      // verify event arguments
      allEvents.forEach(event => {
        const [eventName, ...args] = event;

        if (eventName === 'release') {
          expect(args[0]).to.be.an(Object);
          expect(args[1]).to.be(undefined);
          expect(args[2]).to.be(undefined);
        } else if (eventName === 'acquireRequest') {
          expect(args[0]).to.be.a('number');
          expect(args[1]).to.be(undefined);
          expect(args[2]).to.be(undefined);
        } else if (eventName === 'acquireSuccess') {
          expect(args[0]).to.be.a('number');
          expect(args[1]).to.be.an(Object);
          expect(args[2]).to.be(undefined);
        } else if (eventName === 'acquireFail') {
          expect(args[0]).to.be.a('number');
          expect(args[1]).to.be.an(Error);
          expect(args[2]).to.be(undefined);
        } else if (eventName === 'createRequest') {
          expect(args[0]).to.be.a('number');
          expect(args[1]).to.be(undefined);
          expect(args[2]).to.be(undefined);
        } else if (eventName === 'createSuccess') {
          expect(args[0]).to.be.a('number');
          expect(args[1]).to.be.an(Object);
          expect(args[2]).to.be(undefined);
        } else if (eventName === 'createFail') {
          expect(args[0]).to.be.a('number');
          expect(args[1]).to.be.an(Error);
          expect(args[2]).to.be(undefined);
        } else if (eventName === 'destroyRequest') {
          expect(args[0]).to.be.a('number');
          expect(args[1]).to.be.an(Object);
          expect(args[2]).to.be(undefined);
        } else if (eventName === 'destroySuccess') {
          expect(args[0]).to.be.a('number');
          expect(args[1]).to.be.an(Object);
          expect(args[2]).to.be(undefined);
        } else if (eventName === 'destroyFail') {
          expect(args[0]).to.be.a('number');
          expect(args[1]).to.be.an(Object);
          expect(args[2]).to.be.an(Error);
        } else if (eventName === 'startReaping') {
          expect(args[0]).to.be(undefined);
          expect(args[1]).to.be(undefined);
          expect(args[2]).to.be(undefined);
        } else if (eventName === 'stopReaping') {
          expect(args[0]).to.be(undefined);
          expect(args[1]).to.be(undefined);
          expect(args[2]).to.be(undefined);
        } else if (eventName === 'poolDestroyRequest') {
          expect(args[0]).to.be.a('number');
          expect(args[1]).to.be(undefined);
          expect(args[2]).to.be(undefined);
        } else if (eventName === 'poolDestroySuccess') {
          expect(args[0]).to.be.a('number');
          expect(args[1]).to.be(undefined);
          expect(args[2]).to.be(undefined);
        } else {
          expect('Invalid event type').to.be.false;
        }
      });
    });

    describe('running / removing listeners', () => {
      let listenerCallCount = 0;
      let removableListener = () => {
        listenerCallCount++;
        throw new Error();
      };

      beforeEach(() => {
        listenerCallCount = 0;
        pool = new Pool({
          create() {
            return Promise.delay(10).then(() => Promise.resolve({ a: 0 }));
          },
          destroy(resource) {
            return Promise.delay(10).then(() => Promise.resolve());
          },
          min: 0,
          max: 3,
          propagateCreateError: true
        });

        pool.on('acquireRequest', removableListener);
        pool.on('acquireRequest', () => {
          listenerCallCount++;
          throw new Error();
        });
        pool.on('acquireRequest', () => {
          listenerCallCount++;
          throw new Error();
        });

        pool.on('createRequest', removableListener);
        pool.on('createRequest', () => {
          listenerCallCount++;
          throw new Error();
        });
        pool.on('createRequest', () => {
          listenerCallCount++;
          throw new Error();
        });
      });

      afterEach(async () => {
        return pool.destroy();
      });

      it('broken listener should not stop running other listeners', async () => {
        const pendingAcquire = pool.acquire();
        const resource = await pendingAcquire.promise;
        expect(listenerCallCount).to.be(6);
        pool.release(resource);
      });

      it('removing single listener', async () => {
        pool.removeListener('acquireRequest', removableListener);
        const pendingAcquire = pool.acquire();
        const resource = await pendingAcquire.promise;
        expect(listenerCallCount).to.be(5);
        pool.release(resource);
      });

      it('removing all listeners of event', async () => {
        pool.removeAllListeners('acquireRequest');
        const pendingAcquire = pool.acquire();
        const resource = await pendingAcquire.promise;
        expect(listenerCallCount).to.be(3);
        pool.release(resource);
      });

      it('destroy removes all event listeners', async () => {
        expect(pool.emitter.eventNames()).to.have.length(2);
        await pool.destroy();
        expect(pool.emitter.eventNames()).to.have.length(0);
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
