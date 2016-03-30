"use strict";

var Boom = require('boom');

module.exports = function (err) {
  var error;
  var code = err.code;

  if (code === undefined) {
    return Boom.wrap(err, 500, 'An unhandled error occurred, contact an administrator for more information');
  }

  if (code === '42P01') {
    // undefined_table
    return Boom.notFound('Table or view not found');
  }

  if (code.match(/^22/)) {
    return Boom.badRequest(err.message);
  }

  if (code.match(/^23/)) {
    return Boom.badRequest(err.message);
  }

  if (code.match(/^42/)) {
    return Boom.badRequest(err.message);
  }

  if (code === 'ECONNREFUSED') {
    return Boom.badGateway('Connection refused');
  }

  return Boom.wrap(err, 500, 'An unhandled error occurred, contact an administrator for more information');
};