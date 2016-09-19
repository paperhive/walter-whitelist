const co = require('co');
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
const whitelist = co.wrap(function* whitelist(src, allowed, _options) {
  // init default options
  const options = _.defaults({}, _options, {
    // ignore keys in `src` that are not whitelisted in the `allowed` obj
    // (otherwise a WhitelistError is thrown)
    omitDisallowed: false,
    // remove keys with undefined values
    // (values of keys which are in `allowed` obj but not in `src` are set to
    // undefined by default)
    omitUndefined: false,
    // path in allowed parameter (for recursive calls)
    path: '',
  });

  if (_.isBoolean(allowed)) {
    if (allowed) return src;
    if (options.omitDisallowed) return undefined;
    throw new WhitelistError('value not allowed', options.path);
  }

  if (_.isFunction(allowed)) {
    try {
      return yield Promise.resolve(allowed(src, options));
    } catch (error) {
      if (options.omitDisallowed) return undefined;
      throw error;
    }
  }

  if (_.isArray(allowed)) {
    if (allowed.length !== 1) {
      throw new WhitelistError('allowed array not of length 1', options.path);
    }
    if (!_.isArray(src)) {
      throw new WhitelistError('src is not an array', options.path);
    }

    const result = yield src.map(co.wrap(function* whitelistArray(el, index) {
      const arrayOptions = _.clone(options);
      arrayOptions.path += `[${index}]`;
      try {
        return yield whitelist(el, allowed[0], arrayOptions);
      } catch (error) {
        if (options.omitDisallowed) return undefined;
        throw error;
      }
    }));

    // remove undefined (not using _.compact because it removes all falsy elements)
    if (options.omitUndefined) {
      const cleanResult = [];
      result.forEach((el) => {
        if (el !== undefined) cleanResult.push(el);
      });
      return cleanResult;
    }

    return result;
  }

  if (_.isObject(allowed)) {
    if (!_.isObject(src)) throw new WhitelistError('src is not an object');

    // check for extra keys
    const srcKeys = new Set(Object.keys(src));
    const allowedKeys = new Set(Object.keys(allowed));
    const disallowedKeys = setDifference(srcKeys, allowedKeys);
    if (!options.omitDisallowed) {
      if (disallowedKeys.size) {
        throw new WhitelistError(
          `The following fields are not allowed: ${
            Array.from(disallowedKeys).map(key => options.path + key).join(', ')
          }. Allowed fields: ${Array.from(allowedKeys).join(', ')}.`,
          disallowedKeys
        );
      }
    }

    const result = yield _.mapValues(allowed, co.wrap(function* whitelistObject(value, key) {
      const objectOptions = _.clone(options);
      if (!objectOptions.path) objectOptions.path = key;
      else objectOptions.path += `.${key}`;
      try {
        return yield whitelist(src[key], value, objectOptions);
      } catch (error) {
        if (options.omitDisallowed) return undefined;
        throw error;
      }
    }));

    // set disallowed fields to undefined if omitDisallowed is true
    // (useful for updating database with user-supplied data)
    if (options.omitDisallowed) disallowedKeys.forEach((k) => { result[k] = undefined; });

    // filter undefined values (if required by options)
    return options.omitUndefined ? _.pickBy(result, v => v !== undefined) : result;
  }

  throw new Error('allowed parameter type not recognized');
});

module.exports = whitelist.default = whitelist.whitelist = whitelist;
whitelist.WhitelistError = WhitelistError;
