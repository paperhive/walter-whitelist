# walter-whitelist [![Build Status](https://travis-ci.org/paperhive/walter-whitelist.svg?branch=master)](https://travis-ci.org/paperhive/walter-whitelist) [![Coverage Status](https://coveralls.io/repos/paperhive/walter-whitelist/badge.svg?branch=master&service=github)](https://coveralls.io/github/paperhive/walter-whitelist?branch=master)

This lightweight module whitelists javascript objects recursively. This is particularly useful in the following situations:

 * you have to check that a user-supplied object only contains keys that the user is allowed to supply, e.g., when handling a POST/PUT request
 * you have to pick fields from an object that the user is allowed to see, e.g., before sending a response to a client

![Walter Whitelist](https://paperhive.github.io/walter-whitelist/logo.svg)

# Examples

## Process user-supplied objects
Before storing user-supplied data in a database, you usually want to check if the object contains fields that the user is allowed to store.

```javascript
let allowed = {name: true, age: true};
whitelist({name: 'Darth', age: 42}, allowed); // resolves with {name: 'Darth', age: 42}
whitelist({id: 23}, allowed); // rejects with WhitelistError (field 'id' is not allowed)
whitelist({name: 'Darth'}, allowed); // resolves with {name: 'Darth', age: undefined}
// omit keys with undefined values:
whitelist({name: 'Darth'}, allowed, {omitUndefined: true}); // resolves with {name: 'Darth'}
```

You can also use a function to check fields:
```javascript
let allowed = {
  name: true,
  age: (age, options) => {
    if (age < 50) return age;
    throw WhitelistError('age must be less than 50', options.path);
  },
};
whitelist({name: 'Darth', age: 42}, allowed); // resolves with {name: 'Darth', age: 42}
whitelist({name: 'Darth', age: 66}, allowed); // rejects with WhitelistError ('age must be less than 50')
```

Nested objects work, too:
```javascript
allowed = {name: true, lightsaber: {color: true}};
whitelist({name: 'Darth', lightsaber: {color: 'red'}}, allowed);  // resolves with {name: 'Darth', lightsaber: {color: 'red'}}
whitelist({name: 'Darth'}, allowed);  // resolves with {name: 'Darth', lightsaber: {color: undefined}}
// omit keys with undefined values:
whitelist({name: 'Darth'}, allowed, {omitUndefined: true}); // resolves with {name: 'Darth', lightsaber: {}}
```

## Pick allowed fields
Before sending data from a database to a client, you want to pick only fields that the client is allowed to see. This can be achieved by using the option `omitDisallowed: true`.

```javascript
let allowed = {name: true, age: true};
whitelist({id: 23, name: 'Darth', age: 42}, allowed, {omitDisallowed: true}); // resolves with {name: 'Darth', age: 42}
whitelist({id: 23, name: 'Darth'}, allowed, {omitDisallowed: true}); // resolves with {name: 'Darth', age: undefined}
// omitDisallowed can be combined with omitUndefined:
whitelist({id: 23, name: 'Darth'}, allowed,
  {omitDisallowed: true, omitUndefined: true}); // resolves with {name: 'Darth'}
```

# Installation
```
npm install walter-whitelist
```

# Documentation
```javascript
const whitelist = require('walter-whitelist');
```

## `whitelist(src, allowed, options)`
 * `src`: source object, array or primitive
 * `allowed`: the checks on `src` are performed according to this value. The following values are accepted:
    * an object `{key: value, ...}`:
       * expects `src` to be an object.
       * iterates over keys and uses the value for whitelisting the corresponding key/value pair in `src`
       * `value` can be any value that is accepted as the `allowed` parameter
    * an array with one element `[value]`:
       * expects `src` to be an array
       * iterates over elements of array `src` and whitelists according to `value`
       * `value` can be any value that is accepted as the `allowed parameter`
    * a function `fn(src, options)`:
       * should return the whitelisted `src` (directly or via a promise)
       * if `omitDisallowed` is `false` and `src` contains disallowed data, the function is responsible for throwing a `WhitelistError` (or rejecting the returned promise with a `WhitelistError`)
    * a boolean: if the value is `true`, `src` is allowed and returned as the result
 * `options`: an object with the following optional keys:
    * `omitUndefined`: if set to `true`, it omits fields in the result whose values are undefined
    * `omitDisallowed`: if set to `true`, it omits fields from src that are not present in `allowed`.
    * `data`: custom data that is recursively passed to any function in the `allowed` parameter.

The function returns a new object with the whitelisted fields and throws a `whitelist.WhitelistError` if a field in `src` is not allowed (unless `omitDisallow` is `true`).
