const co = require('co');
const _ = require('lodash');
const should = require('should');

const whitelist = require('..');

const sleep = t => new Promise(resolve => setTimeout(resolve, t));

describe('whitelist()', () => {
  describe('allowed is not recognized', () => {
    it('should throw', co.wrap(function* () {
      yield whitelist(42, 42).should.be.rejectedWith('allowed parameter type not recognized');
    }));
  });

  describe('allowed is undefined', () => {
    it('should throw', co.wrap(function* () {
      yield whitelist(42, undefined).should.be.rejectedWith('value not allowed');
    }));
  });

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
        .should.be.rejectedWith(/The following field is not allowed: age/);
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
    describe('complex object', () => {
      const group = {
        name: 'Jedi',
        members: [{name: 'Luke', age: 25}, {name: 'Darth', age: 50}],
      };

      it('should throw if nested fails', co.wrap(function* () {
        yield whitelist(
          group,
          {name: true, members: [{name: true, age: allowBelowFifty}]}
        ).should.be.rejectedWith({message: 'number must be below 50', path: 'members[1].age'});
      }));

      it('should return partial whitelisted object with omitDisallowed', co.wrap(function* () {
        const whitelistedGroup = _.cloneDeep(group);
        whitelistedGroup.name = undefined;
        whitelistedGroup.members[1].age = undefined;
        (yield whitelist(
          group,
          {members: [{name: true, age: allowBelowFifty}]},
          {omitDisallowed: true}
        )).should.eql(whitelistedGroup);
      }));

      it('should return partial whitelisted object with omitDisallowed and omitUndefined', co.wrap(function* () {
        const whitelistedGroup = _.cloneDeep(group);
        delete whitelistedGroup.name;
        delete whitelistedGroup.members[1].age;
        (yield whitelist(
          group,
          {members: [{name: true, age: allowBelowFifty}]},
          {omitDisallowed: true, omitUndefined: true}
        )).should.eql(whitelistedGroup);
      }));

      it('should return whitelisted object', co.wrap(function* () {
        (yield whitelist(group, {name: true, members: [{name: true, age: true}]}))
          .should.eql(group);
      }));
    });

    describe('complex array', () => {
      const posts = [
        {name: 'Schrödinger equations', private: false, authors: ['luke', 'darth']},
        {name: 'Krylov subspaces', private: true, authors: ['darth']},
      ];

      it('should throw if contains disallowed data', co.wrap(function* () {
        yield whitelist(
          posts,
          [{name: true, private: true}]
        ).should.be.rejectedWith({
          message: /The following field is not allowed: \[0]\.authors/, //
          path: '[0].authors',
        });
      }));

      it('should return whitelisted object with custom data', co.wrap(function* () {
        const allowed = [(post, options) => {
          // allow public posts and private posts where the user is an author
          const isAuthor = options.data && post.authors.indexOf(options.data.user) !== -1;
          return whitelist(
            post,
            (!post.private || isAuthor) && {name: true, authors: [true]},
            options
          );
        }];

        (yield whitelist(posts, allowed, {omitDisallowed: true, omitUndefined: true}))
          .should.eql([{name: 'Schrödinger equations', authors: ['luke', 'darth']}]);
        (yield whitelist(posts, allowed, {omitDisallowed: true, omitUndefined: true, data: {user: 'luke'}}))
          .should.eql([{name: 'Schrödinger equations', authors: ['luke', 'darth']}]);
        (yield whitelist(posts, allowed, {omitDisallowed: true, omitUndefined: true, data: {user: 'darth'}}))
          .should.eql([
            {name: 'Schrödinger equations', authors: ['luke', 'darth']},
            {name: 'Krylov subspaces', authors: ['darth']},
          ]);
      }));
    });

    describe('async', () => {
      const allowed = [{
        name: (name, options) => sleep(10).then(() => (name === 'darth' ?
          Promise.reject(new whitelist.WhitelistError('darth is not allowed', options.path)) :
          Promise.resolve(name)
        )),
      }];

      it('should throw if the promise rejects', co.wrap(function* () {
        yield whitelist([{name: 'darth'}], allowed).should.be.rejectedWith({
          message: 'darth is not allowed',
          path: '[0].name',
        });
      }));

      it('should return whitelisted object if the promise resolves', co.wrap(function* () {
        (yield whitelist([{name: 'luke'}], allowed)).should.eql([{name: 'luke'}]);
      }));
    });

    describe('database models', () => {
      const darth = {name: 'darth', settings: {rememberLogin: true}};
      const luke = {name: 'luke', settings: {rememberLogin: false}};
      const userAllowed = (user, options) => whitelist(user, {
        name: true,
        settings: options.data.user && options.data.user === user.name && {
          rememberLogin: true,
        },
      }, options);

      // reference user in group
      const group = {
        name: 'jedis',
        members: [
          {user: darth, roles: ['admin']},
          {user: luke, roles: ['apprentice']},
        ],
      };
      const groupAllowed = {
        name: true,
        members: [{user: userAllowed, roles: [true]}],
      };

      it('should return whitelisted referenced object', co.wrap(function* () {
        (yield whitelist(
          group,
          groupAllowed,
          {omitDisallowed: true, omitUndefined: true, data: {user: 'darth'}}
        ))
          .should.eql({
            name: 'jedis',
            members: [
              {user: darth, roles: ['admin']},
              {user: {name: 'luke'}, roles: ['apprentice']},
            ],
          });
      }));
    });
  });
});
