const { defer, now } = require('./utils');

class UsedResource {
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
  UsedResource
};
