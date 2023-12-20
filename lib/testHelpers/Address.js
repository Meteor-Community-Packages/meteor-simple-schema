class Address {
  constructor(city, state) {
    this.city = city;
    this.state = state;
  }

  toString() {
    return `${this.city}, ${this.state}`;
  }

  clone() {
    return new Address(this.city, this.state);
  }

  equals(other) {
    if (!(other instanceof Address)) {
      return false;
    }
    return JSON.stringify(this) === JSON.stringify(other);
  }

  typeName() { // eslint-disable-line class-methods-use-this
    return 'Address';
  }

  toJSONValue() {
    return {
      city: this.city,
      state: this.state,
    };
  }
}

export default Address;
