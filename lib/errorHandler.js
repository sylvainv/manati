/**
 * Manati PostgreSQL REST API
 * Copyright (C) 2016 Sylvain Verly
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.

 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
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