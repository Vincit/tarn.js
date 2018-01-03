const { defer, now } = require('./utils');

class FreeResource {
  constructor(resource) {
    this.resource = resource;
    this.timestamp = now();
    this.deferred = defer();
  }

  get promise() {
    return this.deferred.promise;
  }

  resolve() {
    this.deferred.resolve();
    return this.resource;
  }
}

module.exports = {
  FreeResource
};
