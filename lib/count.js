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
var sprintf = require("sprintf-js").sprintf;

class Count extends Query {
  /**
   * Build a delete query
   * @param table name of the table
   * @param data not used here
   * @param params to filter the data to delete
   * @returns squel.Query
   */
  build(table, data, params) {
    var countKey = data.count;

    if (countKey === undefined) {
      throw Boom.badRequest('Need to provide a field to base the count on');
    }

    var query = builder.squel.select().field(sprintf("count('%s')", countKey)).from(table);

    var columns = _.keys(_.omit(params, ['limit']));

    query.where(builder.buildWhereExpression(columns, params));

    return query;
  }
}

module.exports = Count;
