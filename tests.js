var Promise = require('bluebird');
var Pool = require('./').Pool;
var expect = require('expect.js');

describe('Tarn', function () {
  var pool = null;

  beforeEach(function () {
    pool = null;
  });

  afterEach(function () {
    if (pool) {
      // Stop the reaping loop.
      pool._stopReaping();
    }
  });

  it('should fail if no opt.create function is given', function () {
    expect(function () {
      pool = new Pool({
        destroy: function () {},
        min: 0,
        max: 1
      });
    }).to.throwException(function (err) {
      expect(err.message).to.equal('Tarn: opt.create function most be provided');
    });
  });

  it('should fail if no opt.destroy function is given', function () {
    expect(function () {
      pool = new Pool({
        create: function () {},
        min: 0,
        max: 1
      });
    }).to.throwException(function (err) {
      expect(err.message).to.equal('Tarn: opt.destroy function most be provided');
    });
  });

  it('should fail if opt.min is missing', function () {
    expect(function () {
      pool = new Pool({
        create: function () {},
        destroy: function () {},
        max: 1
      });
    }).to.throwException(function (err) {
      expect(err.message).to.equal('Tarn: opt.min must be an integer >= 0');
    });
  });

  it('should fail if a non-integer opt.min is given', function () {
    expect(function () {
      pool = new Pool({
        create: function () {},
        destroy: function () {},
        min: '0',
        max: 1
      });
    }).to.throwException(function (err) {
      expect(err.message).to.equal('Tarn: opt.min must be an integer >= 0');
    });
  });

  it('should fail if a negative opt.min is given', function () {
    expect(function () {
      pool = new Pool({
        create: function () {},
        destroy: function () {},
        min: -1,
        max: 1
      });
    }).to.throwException(function (err) {
      expect(err.message).to.equal('Tarn: opt.min must be an integer >= 0');
    });
  });

  it('should fail if opt.max is missing', function () {
    expect(function () {
      pool = new Pool({
        create: function () {},
        destroy: function () {},
        min: 0
      });
    }).to.throwException(function (err) {
      expect(err.message).to.equal('Tarn: opt.max must be an integer > 0');
    });
  });

  it('should fail if a non-integer opt.max is given', function () {
    expect(function () {
      pool = new Pool({
        create: function () {},
        destroy: function () {},
        min: 0,
        max: '1'
      });
    }).to.throwException(function (err) {
      expect(err.message).to.equal('Tarn: opt.max must be an integer > 0');
    });
  });

  it('should fail if a negative opt.max is given', function () {
    expect(function () {
      pool = new Pool({
        create: function () {},
        destroy: function () {},
        min: 0,
        max: -1
      });
    }).to.throwException(function (err) {
      expect(err.message).to.equal('Tarn: opt.max must be an integer > 0');
    });
  });

  it('should fail if a zero opt.max is given', function () {
    expect(function () {
      pool = new Pool({
        create: function () {},
        destroy: function () {},
        min: 0,
        max: 0
      });
    }).to.throwException(function (err) {
      expect(err.message).to.equal('Tarn: opt.max must be an integer > 0');
    });
  });

  it('should fail if opt.min > opt.max is given', function () {
    expect(function () {
      pool = new Pool({
        create: function () {},
        destroy: function () {},
        min: 2,
        max: 1
      });
    }).to.throwException(function (err) {
      expect(err.message).to.equal('Tarn: opt.max is smaller than opt.min');
    });
  });

  it('should fail if a non-integer opt.acquireTimeoutMillis is given', function () {
    expect(function () {
      pool = new Pool({
        create: function () {},
        destroy: function () {},
        min: 2,
        max: 10,
        acquireTimeoutMillis: '10'
      });
    }).to.throwException(function (err) {
      expect(err.message).to.equal('Tarn: invalid opt.acquireTimeoutMillis "10"');
    });
  });

  it('should fail if a negative opt.acquireTimeoutMillis is given', function () {
    expect(function () {
      pool = new Pool({
        create: function () {},
        destroy: function () {},
        min: 2,
        max: 10,
        acquireTimeoutMillis: -10
      });
    }).to.throwException(function (err) {
      expect(err.message).to.equal('Tarn: invalid opt.acquireTimeoutMillis -10');
    });
  });

  it('should fail if a zero opt.acquireTimeoutMillis is given', function () {
    expect(function () {
      pool = new Pool({
        create: function () {},
        destroy: function () {},
        min: 2,
        max: 10,
        acquireTimeoutMillis: 0
      });
    }).to.throwException(function (err) {
      expect(err.message).to.equal('Tarn: invalid opt.acquireTimeoutMillis 0');
    });
  });

  it('should fail if a non-integer opt.createTimeoutMillis is given', function () {
    expect(function () {
      pool = new Pool({
        create: function () {},
        destroy: function () {},
        min: 2,
        max: 10,
        createTimeoutMillis: '10'
      });
    }).to.throwException(function (err) {
      expect(err.message).to.equal('Tarn: invalid opt.createTimeoutMillis "10"');
    });
  });

  it('should fail if a negative opt.createTimeoutMillis is given', function () {
    expect(function () {
      pool = new Pool({
        create: function () {},
        destroy: function () {},
        min: 2,
        max: 10,
        createTimeoutMillis: -10
      });
    }).to.throwException(function (err) {
      expect(err.message).to.equal('Tarn: invalid opt.createTimeoutMillis -10');
    });
  });

  it('should fail if a zero opt.createTimeoutMillis is given', function () {
    expect(function () {
      pool = new Pool({
        create: function () {},
        destroy: function () {},
        min: 2,
        max: 10,
        createTimeoutMillis: 0
      });
    }).to.throwException(function (err) {
      expect(err.message).to.equal('Tarn: invalid opt.createTimeoutMillis 0');
    });
  });

  it('should fail if a non-integer opt.idleTimeoutMillis is given', function () {
    expect(function () {
      pool = new Pool({
        create: function () {},
        destroy: function () {},
        min: 2,
        max: 10,
        idleTimeoutMillis: '10'
      });
    }).to.throwException(function (err) {
      expect(err.message).to.equal('Tarn: invalid opt.idleTimeoutMillis "10"');
    });
  });

  it('should fail if a negative opt.idleTimeoutMillis is given', function () {
    expect(function () {
      pool = new Pool({
        create: function () {},
        destroy: function () {},
        min: 2,
        max: 10,
        idleTimeoutMillis: -10
      });
    }).to.throwException(function (err) {
      expect(err.message).to.equal('Tarn: invalid opt.idleTimeoutMillis -10');
    });
  });

  it('should fail if a zero opt.idleTimeoutMillis is given', function () {
    expect(function () {
      pool = new Pool({
        create: function () {},
        destroy: function () {},
        min: 2,
        max: 10,
        idleTimeoutMillis: 0
      });
    }).to.throwException(function (err) {
      expect(err.message).to.equal('Tarn: invalid opt.idleTimeoutMillis 0');
    });
  });

  it('should fail if a non-integer opt.reapIntervalMillis is given', function () {
    expect(function () {
      pool = new Pool({
        create: function () {},
        destroy: function () {},
        min: 2,
        max: 10,
        reapIntervalMillis: '10'
      });
    }).to.throwException(function (err) {
      expect(err.message).to.equal('Tarn: invalid opt.reapIntervalMillis "10"');
    });
  });

  it('should fail if a negative opt.reapIntervalMillis is given', function () {
    expect(function () {
      pool = new Pool({
        create: function () {},
        destroy: function () {},
        min: 2,
        max: 10,
        reapIntervalMillis: -10
      });
    }).to.throwException(function (err) {
      expect(err.message).to.equal('Tarn: invalid opt.reapIntervalMillis -10');
    });
  });

  it('should fail if a zero opt.reapIntervalMillis is given', function () {
    expect(function () {
      pool = new Pool({
        create: function () {},
        destroy: function () {},
        min: 2,
        max: 10,
        reapIntervalMillis: 0
      });
    }).to.throwException(function (err) {
      expect(err.message).to.equal('Tarn: invalid opt.reapIntervalMillis 0');
    });
  });

  describe('acquire', function () {

    it('should acquire opt.max resources (async creator)', function () {
      var createCalled = 0;
      var destroyCalled = 0;

      pool = new Pool({
        create: function (callback) {
          var a = createCalled++;

          setTimeout(function () {
            callback(null, {a: a});
          }, 10);
        },
        destroy: function () {
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
      ]).then(function (res) {
        expect(sortBy(res, 'a')).to.eql([{a: 0}, {a: 1}, {a: 2}, {a: 3}]);

        expect(createCalled).to.equal(4);
        expect(destroyCalled).to.equal(0);

        expect(pool.numUsed()).to.equal(4);
        expect(pool.numFree()).to.equal(0);
        expect(pool.numPendingAcquires()).to.equal(0);
        expect(pool.numPendingCreates()).to.equal(0);
      });
    });

    it('should acquire opt.max resources (promise creator)', function () {
      var createCalled = 0;
      var destroyCalled = 0;

      pool = new Pool({
        create: function () {
          return Promise.resolve({a: createCalled++}).delay(50);
        },
        destroy: function () {
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
      ]).then(function (res) {
        expect(sortBy(res, 'a')).to.eql([{a: 0}, {a: 1}, {a: 2}, {a: 3}]);

        expect(createCalled).to.equal(4);
        expect(destroyCalled).to.equal(0);

        expect(pool.numUsed()).to.equal(4);
        expect(pool.numFree()).to.equal(0);
        expect(pool.numPendingAcquires()).to.equal(0);
        expect(pool.numPendingCreates()).to.equal(0);
      });
    });

    it('should acquire opt.max resources (sync creator)', function () {
      var createCalled = 0;
      var destroyCalled = 0;

      pool = new Pool({
        create: function (callback) {
          callback(null, {a: createCalled++});
        },
        destroy: function () {
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
      ]).then(function (res) {
        expect(sortBy(res, 'a')).to.eql([{a: 0}, {a: 1}, {a: 2}, {a: 3}]);

        expect(createCalled).to.equal(4);
        expect(destroyCalled).to.equal(0);

        expect(pool.numUsed()).to.equal(4);
        expect(pool.numFree()).to.equal(0);
        expect(pool.numPendingAcquires()).to.equal(0);
        expect(pool.numPendingCreates()).to.equal(0);
      });
    });

    it('should acquire at max opt.max resources at a time', function () {
      var createCalled = 0;
      var releasesCalled = false;

      pool = new Pool({
        create: function (callback) {
          callback(null, {a: createCalled++});
        },
        destroy: function () {},
        min: 0,
        max: 5
      });

      return Promise.all([
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise
      ]).then(function (res) {
        expect(sortBy(res, 'a') ).to.eql([{a: 0}, {a: 1}, {a: 2}, {a: 3}, {a: 4}]);

        expect(createCalled).to.equal(5);
        expect(pool.numUsed()).to.equal(5);
        expect(pool.numFree()).to.equal(0);
        expect(pool.numPendingAcquires()).to.equal(0);
        expect(pool.numPendingCreates()).to.equal(0);

        var newAcquires = [
          pool.acquire().promise,
          pool.acquire().promise,
          pool.acquire().promise
        ];

        expect(pool.numPendingAcquires()).to.equal(3);

        setTimeout(function () {
          pool.release(res[2]);
          pool.release(res[3]);
          pool.release(res[4]);
          releasesCalled = true;
        }, 100);

        return Promise.all(newAcquires).then(function (newRes) {
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

    it('should abort an acquire if abort() is called for the return value from the `acquire` method', function (done) {
      var createCalled = 0;
      var destroyCalled = 0;

      pool = new Pool({
        create: function (callback) {
          var a = createCalled++;

          setTimeout(function () {
            callback(null, {a: a});
          }, 50);
        },
        destroy: function () {
          ++destroyCalled;
        },
        min: 2,
        max: 4
      });

      var acquire = pool.acquire();
      expect(pool.numPendingCreates()).to.equal(1);

      setTimeout(function () {
        acquire.abort();
      }, 10);

      acquire.promise.then(function () {
        done(new Error('should not get here'));
      }).catch(function (err) {
        expect(err.message).to.equal('aborted');

        expect(createCalled).to.equal(1);

        expect(pool.numUsed()).to.equal(0);
        expect(pool.numFree()).to.equal(0);
        expect(pool.numPendingAcquires()).to.equal(0);
        expect(pool.numPendingCreates()).to.equal(1);

        return Promise.delay(100).then(function () {
          expect(createCalled).to.equal(1);
          expect(destroyCalled).to.equal(0);

          expect(pool.numUsed()).to.equal(0);
          expect(pool.numFree()).to.equal(1);
          expect(pool.numPendingAcquires()).to.equal(0);

          done();
        });
      }).catch(done);
    });

    it('should validate resources using opt.validate before acquiring', function () {
      var createCalled = 0;
      var destroyCalled = 0;
      var destroyed = null;

      pool = new Pool({
        create: function (callback) {
          callback(null, {a: createCalled++, n: 0});
        },
        validate: function (resource) {
          return resource.a !== 0 || resource.n === 0;
        },
        destroy: function (resource) {
          ++destroyCalled;
          destroyed = resource;
        },
        min: 0,
        max: 2
      });

      return Promise.all([
        acquire(),
        acquire()
      ]).then(function (res) {
        expect(sortBy(res, 'a')).to.eql([{a: 0, n: 1}, {a: 1, n: 1}]);

        expect(createCalled).to.equal(2);
        expect(destroyCalled).to.equal(0);
        expect(pool.numUsed()).to.equal(2);
        expect(pool.numFree()).to.equal(0);
        expect(pool.numPendingAcquires()).to.equal(0);
        expect(pool.numPendingCreates()).to.equal(0);

        pool.release(res[0]);
        pool.release(res[1]);

        return Promise.all([
          acquire(),
          acquire()
        ]);
      }).then(function (res) {
        expect(res).to.eql([{a: 1, n: 2}, {a: 2, n: 1}]);

        expect(createCalled).to.equal(3);
        expect(destroyCalled).to.equal(1);
        expect(destroyed).to.eql({a: 0, n: 1});
        expect(pool.numUsed()).to.equal(2);
        expect(pool.numFree()).to.equal(0);
        expect(pool.numPendingAcquires()).to.equal(0);
        expect(pool.numPendingCreates()).to.equal(0);
      });

      function acquire() {
        return pool.acquire().promise.then(function (resource) {
          ++resource.n;
          return resource;
        });
      }
    });

  });

  describe('release', function () {

    it('release should release a resource', function () {
      var createCalled = 0;

      pool = new Pool({
        create: function (callback) {
          var a = createCalled++;

          setTimeout(function () {
            callback(null, {a: a});
          }, 10);
        },
        destroy: function () {},
        min: 2,
        max: 4
      });

      return Promise.all([
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise
      ]).then(function (res) {
        expect(sortBy(res, 'a')).to.eql([{a: 0}, {a: 1}, {a: 2}]);

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
      }).then(function (res) {
        expect(res).to.eql([{a: 1}, {a: 2}, {a: 3}]);

        expect(createCalled).to.equal(4);
        expect(pool.numUsed()).to.equal(4);
        expect(pool.numFree()).to.equal(0);
        expect(pool.numPendingAcquires()).to.equal(0);
        expect(pool.numPendingCreates()).to.equal(0);
      });
    });

    it('should acquire pending acquires after release', function () {
      var createCalled = 0;
      var releaseCalled = false;

      pool = new Pool({
        create: function (callback) {
          var a = createCalled++;

          setTimeout(function () {
            callback(null, {a: a});
          }, 1);
        },
        destroy: function () {},
        min: 0,
        max: 2
      });

      return Promise.all([
        pool.acquire().promise,
        pool.acquire().promise
      ]).then(function (res) {
        var pendingAcquire = pool.acquire();

        expect(createCalled).to.equal(2);
        expect(pool.numUsed()).to.equal(2);
        expect(pool.numFree()).to.equal(0);
        expect(pool.numPendingAcquires()).to.equal(1);
        expect(pool.numPendingCreates()).to.equal(0);

        setTimeout(function () {
          releaseCalled = true;
          pool.release(findBy(res, 'a', 1));
        }, 100);

        return pendingAcquire.promise;
      }).then(function (res) {
        expect(res).to.eql({a: 1});
        expect(releaseCalled).to.equal(true);
      });
    });

    it('should ignore unknown resources', function () {
      var createCalled = 0;
      var destroyCalled = 0;

      pool = new Pool({
        create: function (callback) {
          var a = createCalled++;

          setTimeout(function () {
            callback(null, {a: a});
          }, 1);
        },
        destroy: function () {
          ++destroyCalled;
        },
        min: 0,
        max: 2
      });

      return Promise.all([
        pool.acquire().promise,
        pool.acquire().promise
      ]).then(function (res) {
        expect(sortBy(res, 'a')).to.eql([{a: 0}, {a: 1}]);

        // These should do nothing, since the resources are not referentially equal.
        pool.release({a: 0});
        pool.release({a: 1});
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

  describe('destroy', function () {

    it('should wait for all creates to finish, and resources to be returned to the pool', function () {
      var releaseCalled = false;
      var destroyCalled = 0;
      var createCalled = 0;
      var abortCalled = false;

      pool = new Pool({
        create: function () {
          ++createCalled;
          return Promise.delay(50).return({});
        },
        destroy: function () {
          ++destroyCalled;
        },
        min: 0,
        max: 10
      });

      return Promise.all([
        pool.acquire().promise,
        pool.acquire().promise
      ]).then(function (res) {

        // Release before the create from the acquire is ready.
        setTimeout(function () {
          pool.release(res[0]);
        }, 10);

        pool.acquire().promise.then(function () {
          throw new Error('should not get here since the creation takes 50 ms');
        }).catch(function (err) {
          expect(err.message).to.equal('aborted');
          // destroy should abort
          abortCalled = true;
        });

        // Release after the create from the acquire is ready.
        setTimeout(function () {
          pool.release(res[1]);
          releaseCalled = true;
        }, 100);

        return pool.destroy();
      }).then(function () {
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

  });

  describe('acquireTimeout', function () {

    it('should acquire fail to acquire opt.max + 1 resources after acquireTimeoutMillis', function (done) {
      var createCalled = 0;
      var acquireTimeoutMillis = 100;

      pool = new Pool({
        create: function (callback) {
          var a = createCalled++;

          setTimeout(function () {
            callback(null, {a: a});
          }, 10);
        },
        destroy: function () {},
        min: 2,
        max: 5,
        acquireTimeoutMillis: acquireTimeoutMillis
      });

      var now = Date.now();

      Promise.all([
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise,
        pool.acquire().promise
      ]).then(function () {
        done(new Error('should not get here'));
      }).catch(function (err) {
        var duration = Date.now() - now;

        expect(err).to.be.a(Promise.TimeoutError);

        expect(duration).to.be.greaterThan(acquireTimeoutMillis - 5);
        expect(duration - acquireTimeoutMillis).to.be.lessThan(50);

        expect(createCalled).to.equal(5);
        expect(pool.numUsed()).to.equal(5);
        expect(pool.numFree()).to.equal(0);
        expect(pool.numPendingAcquires()).to.equal(0);
        expect(pool.numPendingCreates()).to.equal(0);

        done();
      }).catch(done);
    });

    it('should recover after acquireTimeoutMillis if the create function returns an error', function (done) {
      var createCalled = 0;
      var acquireTimeoutMillis = 100;

      pool = new Pool({
        create: function (callback) {
          ++createCalled;

          setTimeout(function () {
            callback(new Error('foo'));
          }, 10);
        },
        destroy: function () {},
        min: 2,
        max: 4,
        acquireTimeoutMillis: acquireTimeoutMillis
      });

      var now = Date.now();

      pool.acquire().promise.then(function () {
        done(new Error('should not get here'));
      }).catch(function (err) {
        var duration = Date.now() - now;

        expect(err).to.be.a(Promise.TimeoutError);

        expect(duration).to.be.greaterThan(acquireTimeoutMillis - 5);
        expect(duration - acquireTimeoutMillis).to.be.lessThan(50);

        expect(createCalled).to.equal(1);
        expect(pool.numUsed()).to.equal(0);
        expect(pool.numFree()).to.equal(0);
        expect(pool.numPendingAcquires()).to.equal(0);
        expect(pool.numPendingCreates()).to.equal(0);

        done();
      }).catch(done);
    });

    it('should recover after acquireTimeoutMillis if the create function throws an error', function (done) {
      var createCalled = 0;
      var acquireTimeoutMillis = 100;

      pool = new Pool({
        create: function () {
          ++createCalled;
          throw new Error('foo');
        },
        destroy: function () {},
        min: 2,
        max: 4,
        acquireTimeoutMillis: acquireTimeoutMillis
      });

      var now = Date.now();

      pool.acquire().promise.then(function () {
        done(new Error('should not get here'));
      }).catch(function (err) {
        var duration = Date.now() - now;

        expect(err).to.be.a(Promise.TimeoutError);

        expect(duration).to.be.greaterThan(acquireTimeoutMillis - 5);
        expect(duration - acquireTimeoutMillis).to.be.lessThan(50);

        expect(createCalled).to.equal(1);
        expect(pool.numUsed()).to.equal(0);
        expect(pool.numFree()).to.equal(0);
        expect(pool.numPendingAcquires()).to.equal(0);
        expect(pool.numPendingCreates()).to.equal(0);

        done();
      }).catch(done);
    });

  });

  describe('idleTimeoutMillis', function () {

    it('should remove idle resources after idleTimeoutMillis', function (done) {
      var createCalled = 0;
      var destroyCalled = 0;
      var destroyed = [];

      pool = new Pool({
        create: function (callback) {
          var a = createCalled++;

          setTimeout(function () {
            callback(null, {a: a});
          }, 10);
        },
        destroy: function (resource) {
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
        pool.acquire().promise
      ]).then(function (res) {
        expect(sortBy(res, 'a')).to.eql([{a: 0}, {a: 1}, {a: 2}]);

        expect(pool.numUsed()).to.equal(3);
        expect(pool.numFree()).to.equal(0);

        pool.release(res[0]);
        pool.release(res[1]);

        expect(destroyCalled).to.equal(0);
        expect(pool.numUsed()).to.equal(1);
        expect(pool.numFree()).to.equal(2);

        return Promise.delay(50);
      }).then(function () {

        expect(destroyCalled).to.equal(0);
        expect(pool.numUsed()).to.equal(1);
        expect(pool.numFree()).to.equal(2);

        return Promise.delay(60);
      }).then(function () {
        expect(destroyed).to.eql([{a: 0}, {a: 1}]);

        expect(destroyCalled).to.equal(2);
        expect(pool.numUsed()).to.equal(1);
        expect(pool.numFree()).to.equal(0);

        done();
      }).catch(done);
    });

    it('should always keep opt.min resources', function (done) {
      var createCalled = 0;
      var destroyCalled = 0;
      var destroyed = [];

      pool = new Pool({
        create: function (callback) {
          var a = createCalled++;

          setTimeout(function () {
            callback(null, {a: a});
          }, 10);
        },
        destroy: function (resource) {
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
      ]).then(function (res) {
        expect(sortBy(res, 'a')).to.eql([{a: 0}, {a: 1}, {a: 2}, {a: 3}]);

        expect(pool.numUsed()).to.equal(4);
        expect(pool.numFree()).to.equal(0);

        pool.release(findBy(res, 'a', 0));
        pool.release(findBy(res, 'a', 1));
        pool.release(findBy(res, 'a', 2));

        expect(destroyCalled).to.equal(0);
        expect(pool.numUsed()).to.equal(1);
        expect(pool.numFree()).to.equal(3);

        return Promise.delay(50);
      }).then(function () {

        expect(destroyCalled).to.equal(0);
        expect(pool.numUsed()).to.equal(1);
        expect(pool.numFree()).to.equal(3);

        return Promise.delay(60);
      }).then(function () {
        expect(sortBy(destroyed, 'a')).to.eql([{a: 0}, {a: 1}]);

        expect(destroyCalled).to.equal(2);
        expect(pool.numUsed()).to.equal(1);
        expect(pool.numFree()).to.equal(1);

        done();
      }).catch(done);
    });

    it('should release unused resources after idleTimeoutMillis when resources are repeatedly released and freed', function (done) {
      var createCalled = 0;
      var destroyCalled = 0;
      var destroyed = [];
      var finished = false;

      pool = new Pool({
        create: function (callback) {
          var a = createCalled++;

          setTimeout(function () {
            callback(null, {a: a});
          }, 10);
        },
        destroy: function (resource) {
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
      ]).then(function (res) {
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

          return Promise.delay(rand()).then(function () {
            if (finished) return;
            return pool.acquire().promise;
          }).then(function (res) {
            if (finished) return;
            return Promise.delay(rand()).then(function () {
              return releaseAndAcquireThread(res);
            });
          });
        }

        function rand() {
          return Math.round(1 + Math.random() * 4);
        }

        return Promise.delay(200);
      }).then(function () {
        finished = true;

        expect(createCalled).to.equal(4);
        expect(destroyCalled).to.equal(2);
        expect(pool.numFree() + pool.numUsed()).to.equal(2);
        done();
      }).catch(function (err) {
        finished = true;
        done(err);
      });
    });

  });

});

function sortBy(arr, key) {
  return arr.sort(function (x1, x2) {
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
  for (var i = 0, l = arr.length; i < l; ++i) {
    if (arr[i][key] === value) {
      return arr[i];
    }
  }

  return null;
}