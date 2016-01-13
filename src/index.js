const _ = require('lodash');
const util = require('util');

function WhitelistError(message, path) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
  this.path = path;
}
util.inherits(WhitelistError, Error);

// compute a\b
function setDifference(a, b) {
  return new Set(Array.from(a).filter(el => !b.has(el)));
}

/* check if obj is valid and return object with value 'undefined' for
 * missing keys in obj */
function whitelist(src, allowed, _options, _path) {
  // init default options
  const options = _.defaults(_options || {}, {
    // ignore keys in `src` that are not whitelisted in the `allowed` obj
    // (otherwise a WhitelistError is thrown)
    omitDisallowed: false,
    // remove keys with undefined values
    // (values of keys which are in `allowed` obj but not in `src` are set to
    // undefined by default)
    omitUndefined: false,
  });

  // init path
  const path = _path || '';

  // check input
  if (!_.isPlainObject(src) || !_.isPlainObject(allowed)) {
    throw new WhitelistError('expected an object' +
        (path ? ' at path ' + path : ''));
  }

  // check for extra keys
  if (!options.omitDisallowed) {
    const srcKeys = new Set(Object.keys(src));
    const allowedKeys = new Set(Object.keys(allowed));
    const disallowedKeys = setDifference(srcKeys, allowedKeys);
    if (disallowedKeys.size) {
      throw new WhitelistError('the following fields are not allowed: ' +
          Array.from(disallowedKeys).map((key) => path + key).join(', '),
          disallowedKeys);
    }
  }

  // construct new object
  const res = _.mapValues(allowed, (val, key) => {
    const currentPath = path + key;
    // true: use full object
    if (val === true) return src[key];

    // object: get whitelisted object recursively
    if (_.isPlainObject(val)) {
      return whitelist(src[key] || {}, val, options, currentPath + '.');
    }

    // function: use result of function call
    if (_.isFunction(val)) return val(src[key], currentPath);
  });

  // filter undefined values (if required by options)
  return options.omitUndefined ? _.pickBy(res, (v) => v !== undefined) : res;
}

module.exports = whitelist.default = whitelist.whitelist = whitelist;
whitelist.WhitelistError = WhitelistError;
