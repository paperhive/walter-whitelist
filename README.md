# walter-whitelist [![Build Status](https://travis-ci.org/paperhive/walter-whitelist.svg?branch=master)](https://travis-ci.org/paperhive/walter-whitelist) [![Coverage Status](https://coveralls.io/repos/paperhive/walter-whitelist/badge.svg?branch=master&service=github)](https://coveralls.io/github/paperhive/walter-whitelist?branch=master)

This lightweight module whitelists javascript objects recursively. This is particularly useful in the following situations:

 * you have to check that a user-supplied object only contains keys that the user is allowed to supply, e.g., when handling a POST/PUT request
 * you have to pick fields from an object that the user is allowed to see, e.g., before sending a response to a client

# Examples

## Process user-supplied objects
Before storing user-supplied data in a database, you usually want to check if the object contains fields that the user is allowed to store.

```javascript
let allowed = {name: true, age: true};
whitelist({name: 'Darth', age: 42}, allowed); // returns {name: 'Darth', age: 42}
whitelist({id: 23}, allowed); // throws WhitelistError (field 'id' is not allowed)
whitelist({name: 'Darth'}, allowed); // returns {name: 'Darth', age: undefined}
// omit keys with undefined values:
whitelist({name: 'Darth'}, allowed, {omitUndefined: true}); // returns {name: 'Darth'}
```

You can also use a function to check fields:
```javascript
let allowed = {
  name: true,
  age: (v) => v < 50 ? v : undefined
};
whitelist({name: 'Darth', age: 42}, allowed); // returns {name: 'Darth', age: 42}
whitelist({name: 'Darth', age: 66}, allowed); // returns {name: 'Darth', age: undefined}
```

Nested objects work, too:
```javascript
allowed = {name: true, lightsaber: {color: true}};
whitelist({name: 'Darth', lightsaber: {color: 'red'}}, allowed);  // returns {name: 'Darth', lightsaber: {color: 'red'}}
whitelist({name: 'Darth'}, allowed);  // returns {name: 'Darth', lightsaber: {color: undefined}}
// omit keys with undefined values:
whitelist({name: 'Darth'}, allowed, {omitUndefined: true}); // returns {name: 'Darth', lightsaber: {}}
```

## Pick allowed fields
Before sending data from a database to a client, you want to pick only fields that the client is allowed to see. This can be achieved by using the option `omitDisallowed: true`.

```javascript
let allowed = {name: true, age: true};
whitelist({id: 23, name: 'Darth', age: 42}, allowed, {omitDisallowed: true}); // returns {name: 'Darth', age: 42}
whitelist({id: 23, name: 'Darth'}, allowed, {omitDisallowed: true}); // returns {name: 'Darth', age: undefined}
// omitDisallowed can be combined with omitUndefined:
whitelist({id: 23, name: 'Darth'}, allowed,
  {omitDisallowed: true, omitUndefined: true}); // returns {name: 'Darth'}

# Installation
```
npm install walter-whitelist
```

# Documentation
```javascript
const whitelist = require('walter-whitelist');
```

## `dest = whitelist(src, allowed, options)`
 * `src`: source object
 * `allowed`: an object that specifies which fields are allowed. The values can be
    * a boolean: if the value is `true`, the field is allowed and *copied* to the result object
    * an object: whitelist is called recursively (for nested objects)
    * a function `fn(value, path)`: the result of the function is placed in the result object
 * `options`: an object with the following optional keys:
    * `omitUndefined`: if set to `true`, it omits fields in the result whose values are undefined
    * `omitDisallowed`: if set to `true`, it omits fields from src that are not present in `allowed`

The function returns a new object with the whitelisted fields and throws a `whitelist.WhitelistError` if a field in `src` is not allowed (unless `omitDisallow` is `true`).
