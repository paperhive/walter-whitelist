const should = require('should');

const whitelist = require('..');

describe('whitelist()', () => {
  it('should return a whitelisted object if all keys match', () => {
    const obj = {name: 'Darth', lightsaber: {color: 'red'}};
    const res = whitelist(obj, {name: true, lightsaber: {color: true}});
    res.should.eql(obj);
  });

  it('should return a whitelisted object if src has less keys', () => {
    const obj = {name: 'Darth'};
    const res = whitelist(obj, {name: true, lightsaber: {color: true}});
    res.should.eql({name: 'Darth', lightsaber: {color: undefined}});
  });

  it('should throw if a key is not whitelisted', () => {
    should(() => {
      whitelist({name: 'Darth', passwordHash: 'acab'}, {name: true});
    }).throw();
  });

  it('should not throw with ignoreNonWhitelisted option', () => {
    whitelist(
      {name: 'Darth', passwordHash: 'acab'},
      {name: true},
      {ignoreNonWhitelisted: true}
    ).should.eql({name: 'Darth'});
  });
});
