const should = require('should');

const whitelist = require('..');

describe('whitelist()', () => {
  it('should return a whitelisted object with booleans', () => {
    const src = {name: 'Darth', age: 42};
    whitelist(src, {name: true, age: true}).should.eql(src);
  });

  it('should return a whitelisted object with nested objects', () => {
    whitelist(
      {name: 'Darth', lightsaber: {color: 'red'}},
      {name: true, lightsaber: {color: true}}
    ).should.eql({name: 'Darth', lightsaber: {color: 'red'}});
  });

  it('should return a whitelisted object with functions', () => {
    whitelist(
      {name: 'Darth', age: 42},
      {name: true, age: v => (v < 50 ? v : undefined)}
    ).should.eql({name: 'Darth', age: 42});
    whitelist(
      {name: 'Darth', age: 66},
      {name: true, age: v => (v < 50 ? v : undefined)}
    ).should.eql({name: 'Darth', age: undefined});
  });

  it('should return undefined for keys that are missing in src', () => {
    whitelist(
      {name: 'Darth'},
      {name: true, lightsaber: {color: true}}
    ).should.eql({name: 'Darth', lightsaber: {color: undefined}});
  });

  it('should remove keys with undefined values if omitUndefined === true', () => {
    const src = {name: 'Darth'};
    const res = whitelist(src, {name: true, lightsaber: {color: true}},
        {omitUndefined: true});
    res.should.eql({name: 'Darth', lightsaber: {}});
  });

  it('should throw if a key is not whitelisted', () => {
    should(() => {
      whitelist({id: 23, name: 'Darth'}, {name: true});
    }).throw();
  });

  it('should omit disallowed keys with omitDisallowed === true', () => {
    whitelist(
      {name: 'Darth', passwordHash: 'acab'},
      {name: true},
      {omitDisallowed: true}
    ).should.eql({name: 'Darth'});
  });

  it('should throw if arguments are not plain objects', () => {
    should(() => whitelist('no pojo', {})).throw();
    should(() => whitelist({}, 'no pojo')).throw();
  });
});
