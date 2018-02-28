'use strict';

const defer = require('./utils').defer;
const now = require('./utils').now;

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
