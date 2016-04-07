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

var buildOrderStatement = function (query, orders) {
  return orders.map(value => {
    let type = value.split('::');
    let orderType = type[0].toLowerCase();
    let name = type[1];

    if (orderType !== 'asc' && orderType !== 'desc') {
      throw Boom.badRequest("Invalid order '" + orderType + "', valid values are 'desc' or 'asc'");
    }

    return query.order(name, orderType === 'asc');
  });
};

class Select {
  constructor(db, logger) {
    this.db = db;
    this.logger = logger;
  }

  build(table, params) {
    // get the queried columns, remove the reserved words, as they are not columns
    var columns = _.keys(_.omit(params,
      'order', 'limit'
    ));

    var query = builder.squel.select().from(table);

    // build order statement
    if (params.order !== undefined) {
       buildOrderStatement(query, params.order.split(','));
    }

    // build the limit statement
    if (params.limit !== undefined) {
      query.limit(parseInt(params.limit));
    }

    if (columns.length !== 0) {
      query.where(builder.buildWhereExpression(columns, params));
    }

    return query;
  }

  query(table, params) {
    var query = this.build(table, params).toParam();

    this.logger.debug(query);

    return this.db.any(query.text, query.values);
  }
}

module.exports = Select;

