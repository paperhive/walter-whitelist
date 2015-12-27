# walter-whitelist [![Build Status](https://travis-ci.org/paperhive/walter-whitelist.svg?branch=master)](https://travis-ci.org/paperhive/walter-whitelist) [![Coverage Status](https://coveralls.io/repos/paperhive/walter-whitelist/badge.svg?branch=master&service=github)](https://coveralls.io/github/paperhive/walter-whitelist?branch=master)

This lightweight module whitelists javascript objects recursively. This is particularly useful in the following situations:

 * you have to check that a user-supplied object only contains keys that the user is allowed to supply, e.g., when handling a POST/PUT request
 * you have to pick fields from an object that the user is allowed to see, e.g., before sending a response to a client

# Examples

## Process user-supplied objects
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
TODO

# Installation
```
npm install walter-whitelist
```

# Documentation
```javascript
const whitelist = require('walter-whitelist');
```

## dest = whitelist(src, allowed, options)
TODO
