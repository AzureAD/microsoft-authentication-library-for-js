'use strict';

/**
 * `BadRequestError` error.
 *
 * @api public
 */
function BadRequestError(message) {
  Error.call(this);
  Error.captureStackTrace(this, BadRequestError);
  this.name = 'BadRequestError';
  this.message = message || null;
}

/**
 * Inherit from `Error`.
 */
BadRequestError.prototype = Object.create(Error.prototype);

/**
 * Expose `BadRequestError`.
 */
module.exports = BadRequestError;
