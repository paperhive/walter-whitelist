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
function whitelist(obj, whitelistObj, _options, _path) {
  // init default options
  const options = _.defaults(_options || {}, {
    // ignore keys in obj that are not whitelisted in whitelistObj
    // (otherwise a WhitelistError is thrown)
    ignoreNonWhitelisted: false,
    // remove keys with undefined values
    // (values of keys which are in whitelistObj but not in obj are set to
    // undefined by default)
    omitUndefined: false,
  });

  // init path
  const path = _path || '';

  // check input
  if (!_.isPlainObject(obj) || !_.isPlainObject(whitelistObj)) {
    throw new WhitelistError('expected an object' +
        (path ? ' at path ' + path : ''));
  }

  // check for extra keys
  if (!options.ignoreNonWhitelisted) {
    const givenKeys = new Set(Object.keys(obj));
    const whitelistedKeys = new Set(Object.keys(whitelistObj));
    const nonWhitelistedKeys = setDifference(givenKeys, whitelistedKeys);
    if (nonWhitelistedKeys.size) {
      throw new WhitelistError('the following fields are not allowed: ' +
          Array.from(nonWhitelistedKeys).map((key) => path + key).join(', '),
          nonWhitelistedKeys);
    }
  }

  // construct new object
  const res = _.mapValues(whitelistObj, (val, key) => {
    const currentPath = path + key;
    // true: use full object
    if (val === true) return obj[key];

    // object: get whitelisted object recursively
    if (_.isPlainObject(val)) {
      return whitelist(obj[key] || {}, val, options, currentPath + '.');
    }

    // function: use result of function call
    if (_.isFunction(val)) return val(obj[key], currentPath);
  });

  // filter undefined values (if required by options)
  return options.omitUndefined ? _.filter(res, (v) => v !== undefined) : res;
}

module.exports = whitelist.default = whitelist.whitelist = whitelist;
whitelist.WhitelistError = WhitelistError;
