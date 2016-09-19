const co = require('co');
const should = require('should');

const whitelist = require('..');

/*
const darth = {
  // primitives
  name: 'Darth',
  // array of primitives
  alternativeNames: ['Anakin', 'Lord Vader'],
  // nested object
  settings: {color: 'red', remember: true},
  // array with objects
  skills: [{name: 'lightsaber', level: 1}, {name: 'math', level: -1}],
};

const personAllowedRead = (person, options) => {
  const isSelf = options.data && options.data.authenticated === person.name;
  return whitelist(person, {
    name: true,
    alternativeNames: [true],
    settings: isSelf && {color: true, remember: true},
    skills: [{name: true, level: isSelf}],
  }, options);
};

const personAllowedWrite = (person, options) => {
  return whitelist(person, isSelf && {
    name: true,
    alternativeNames: true,
    settings: {color: true, remember: true},
  });
};

const deathstar = {
  name: 'Death star',
  progress: 0.8,
  owner: darth,
};

const placeAllowedRead = {
  name: true,
  progress: true,
  owner: personAllowedRead,
};
*/

describe('whitelist()', () => {
  describe('allowed is boolean', () => {
    it('should throw if allowed is false', co.wrap(function* () {
      yield whitelist(42, false).should.be.rejectedWith('value not allowed');
    }));

    it('should return input if allowed is true', co.wrap(function* () {
      (yield whitelist(42, true)).should.equal(42);
    }));
  });

  function allowBelowFifty(src, options) {
    if (src < 50) return src;
    throw new whitelist.WhitelistError('number must be below 50', options.path);
  }

  describe('allowed is function returning a value', () => {
    it('should throw if allow function throws', co.wrap(function* () {
      yield whitelist(50, allowBelowFifty)
        .should.be.rejectedWith('number must be below 50');
    }));

    it('should return undefined if allow function throws and omitDisallowed is true', co.wrap(function* () {
      should(yield whitelist(50, allowBelowFifty, {omitDisallowed: true}))
        .equal(undefined);
    }));

    it('should use returned value', co.wrap(function* () {
      (yield whitelist(40, allowBelowFifty)).should.equal(40);
    }));
  });

  describe('allowed is function returning a promise', () => {
    it('should throw if allow function throws', co.wrap(function* () {
      yield whitelist(50, co.wrap(allowBelowFifty))
        .should.be.rejectedWith('number must be below 50');
    }));

    it('should return undefined if allow function throws and omitDisallowed is true', co.wrap(function* () {
      should(yield whitelist(50, co.wrap(allowBelowFifty), {omitDisallowed: true}))
        .equal(undefined);
    }));

    it('should use returned value', co.wrap(function* () {
      (yield whitelist(40, co.wrap(allowBelowFifty))).should.equal(40);
    }));
  });

  describe('allowed is array', () => {
    it('should throw if array has !== 1 elements', co.wrap(function* () {
      yield whitelist([42, 1337], [])
        .should.be.rejectedWith('allowed array not of length 1');
      yield whitelist([42, 1337], [true, true])
        .should.be.rejectedWith('allowed array not of length 1');
    }));
    it('should throw if src is not an array', co.wrap(function* () {
      yield whitelist(42, [true]).should.be.rejectedWith('src is not an array');
      yield whitelist('Darth', [true]).should.be.rejectedWith('src is not an array');
      yield whitelist({name: 'Darth'}, [true]).should.be.rejectedWith('src is not an array');
    }));
    it('should throw if src contains disallowed data', co.wrap(function* () {
      yield whitelist([42, 1337], [false]).should.be.rejectedWith('value not allowed');
    }));
    it('should return array clone if data is allowed', co.wrap(function* () {
      (yield whitelist([42, 1337], [true])).should.eql([42, 1337]);
    }));
  });

  describe('allowed is object', () => {
    it('should throw if src is not an object', co.wrap(function* () {
      yield whitelist(5, {name: true}).should.be.rejectedWith('src is not an object');
    }));

    it('should throw if src has additional keys', co.wrap(function* () {
      yield whitelist({name: 'Darth', age: 5}, {name: true})
        .should.be.rejectedWith(/The following fields are not allowed: age/);
    }));

    it('should throw if src contains disallowed data', co.wrap(function* () {
      yield whitelist({name: 'Darth', age: 5}, {name: true, age: false})
        .should.be.rejectedWith('value not allowed');
    }));

    it('should set disallowed fields to undefined if omitDisallowed is true', co.wrap(function* () {
      (yield whitelist({name: 'Darth', age: 5}, {name: true}, {omitDisallowed: true}))
        .should.eql({name: 'Darth', age: undefined});
    }));

    it('should omit disallowed fields if omitDisallowed and omitUndefined are true', co.wrap(function* () {
      (yield whitelist({name: 'Darth', age: 5}, {name: true}, {omitDisallowed: true, omitUndefined: true}))
        .should.eql({name: 'Darth'});
    }));

    it('should return object clone if data is allowed', co.wrap(function* () {
      (yield whitelist({name: 'Darth', age: 5}, {name: true, age: true}))
        .should.eql({name: 'Darth', age: 5});
    }));
  });

  describe('allowed is nested combination', () => {
    it('should throw if nested fails', co.wrap(function* () {
      yield whitelist(
        {members: [{name: 'Darth', age: 50}]},
        {members: [{name: true, age: allowBelowFifty}]}
      ).should.be.rejectedWith({message: 'number must be below 50', path: 'members[].age'});
    }));
  });
});
