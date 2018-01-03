class PromiseInspection {
  constructor({ value, error }) {
    this._value = value;
    this._error = error;
  }

  value() {
    return this._value;
  }

  reason() {
    return this._error;
  }

  isRejected() {
    return !!this._error;
  }

  isFulfilled() {
    return !!this._value;
  }
}

module.exports = {
  PromiseInspection
};
