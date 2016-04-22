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
var builder = require('./queryBuilder');
var Boom = require('boom');
var Query = require('./query');

class Update extends Query {
  /**
   * Build an insert query
   * @param table name of the table
   * @param data json object
   * @returns squel.Query
   */
  build(table, data, params) {
    if (_.isArray(data)) {
      throw Boom.badRequest('Cannot handle array update');
    }

    var keys = _.keys(data);

    // keys must be valid strings
    keys.forEach(key => {
      if (null === key.match(/[a-zA-Z0-9]+/)) {
        throw Boom.badRequest('Malformed column name: ' + key);
      }
    });

    var query = builder.squel.update().table(table);

    var columns = _.keys(params);

    if (columns.length === 0) {
      throw Boom.badRequest('You need to pass query parameters to filter out the data, mass updating is not allowed');
    }

    query.where(builder.buildWhereExpression(columns, params));

    _.forIn(data, function (value, key) {
      query.set(key, value);
    });

    query.returning('*');

    return query;
  }
}

module.exports = Update;