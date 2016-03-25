"use strict";

var Boom = require('boom');

module.exports = function (err) {
  var error;

  switch (err.code) {
    case '42P01': // undefined_table
      error = Boom.notFound('Table not found');
      break;
    case '42703': // undefined_column
    case '22026': // string_data_length_mismatch
    case '22001': // string_data_right_truncation
    case '23502': // not_null_violation
      error = Boom.badData(err.message);
      break;
    case '22P02': // invalid_text_representation
      error = Boom.badRequest('Invalid value for operation');
      break;
    case '23503': // foreign_key_violation
      error = Boom.badData('Foreign key is not respected');
      break;
    case 'ECONNREFUSED':
      error = Boom.badGateway('Connection refused');
      break;
    default:
      error = Boom.wrap(err, 'An unhandled error occurred, contact an administrator for more information', 500);
      break;
  }

  return error;
};