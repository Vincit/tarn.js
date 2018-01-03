const { defer, now } = require('./utils');

class Resource {
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
    return new Resource(this.resource);
  }
}

module.exports = {
  Resource
};
