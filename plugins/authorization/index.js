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

var _ = require('lodash');
var Boom = require('boom');

module.exports = function (dependencies, options) {
  var db = dependencies.db;

  options = _.defaults({
    parseHeader: function (header) {
      return header.split('Bearer ')[1];
    },
    buildAuthorizationQuery: function (authorization) {
      // make sure authorization matches a specific pattern to avoid injection
      if (!authorization.match(/[a-f0-9]{64}/)) {
        throw Boom.badRequest('Invalid token');
      }

      return {
        text: 'select manati_auth.authorize($1);',
        values: [authorization]
      }
    }
  }, options);

  return function* authorize(next) {
    var authorization = options.parseHeader(this.request.get('Authorization'));

    if (authorization === undefined) {
      this.throw(Boom.unauthorized('Please provide a token', 'Bearer'));
    }

    // put this queries in the pre queries, will be executed before the queries in data
    this.request.dbqueries.push(options.buildAuthorizationQuery(authorization));

    yield next;
  };
};


