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

class Delete {
  constructor(db, logger) {
    this.db = db;
    this.logger = logger;
  }

  build(table, params) {
    var query = builder.squel.delete().from(table);

    var columns = _.keys(params);

    if (columns.length === 0) {
      throw Boom.badRequest('You need to pass query parameters to filter out the data, deleting the whole table' +
        ' content is not allowed');
    }

    query.where(builder.buildWhereExpression(columns, params));

    query.returning('*');

    return query;
  }

  query(table, params) {
    var query = this.build(table, params).toParam();

    this.logger.debug(query);

    return this.db.any(query.text, query.values);
  }
}

module.exports = Delete;
