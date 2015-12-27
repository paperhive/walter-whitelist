const should = require('should');

const whitelist = require('..');

describe('whitelist()', () => {
  it('should return a whitelisted object with booleans', () => {
    const obj = {name: 'Darth', lightsaber: 'red'};
    const res = whitelist(obj, {name: true, lightsaber: true});
    res.should.eql(obj);
  });

  it('should return a whitelisted object with nested objects', () => {
    const obj = {name: 'Darth', lightsaber: {color: 'red'}};
    const res = whitelist(obj, {name: true, lightsaber: {color: true}});
    res.should.eql(obj);
  });

  it('should return a whitelisted object with functions', () => {
    const obj = {name: 'Darth', lightsaber: 'red'};
    const res = whitelist(obj, {name: true, lightsaber: () => 'secret'});
    res.should.eql({name: 'Darth', lightsaber: 'secret'});
  });

  it('should return undefined for keys that are missing in src', () => {
    const obj = {name: 'Darth'};
    const res = whitelist(obj, {name: true, lightsaber: {color: true}});
    res.should.eql({name: 'Darth', lightsaber: {color: undefined}});
  });

  it('should remove keys with undefined values if omitUndefined === true', () => {
    const obj = {name: 'Darth'};
    const res = whitelist(obj, {name: true, lightsaber: {color: true}},
        {omitUndefined: true});
    res.should.eql({name: 'Darth', lightsaber: {}});
  });

  it('should throw if a key is not whitelisted', () => {
    should(() => {
      whitelist({name: 'Darth', passwordHash: 'acab'}, {name: true});
    }).throw();
  });

  it('should ignore non-whitelisted keys with ignoreNonWhitelisted === true', () => {
    whitelist(
      {name: 'Darth', passwordHash: 'acab'},
      {name: true},
      {ignoreNonWhitelisted: true}
    ).should.eql({name: 'Darth'});
  });

  it('should throw if arguments are not plain objects', () => {
    should(() => whitelist('no pojo', {})).throw();
    should(() => whitelist({}, 'no pojo')).throw();
  });
});
