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

class Query {
  constructor(db, logger) {
    this.db = db;
    this.logger = logger;
  }

  /**
   * Build an insert query
   * @param table name of the table
   * @param data json object
   * @returns squel.Query
   */
  build(table, data, params) {
    throw Error('Missing implementation for build');
  }

  /**
   * Call the query specified by build
   * @param table name of table
   * @param data if there is data to submit
   * @param params parameters
   * @param authorization an authorization query
   * @returns {*}
   */
  query(table, data, params, authorization) {
    var query = this.build(table, data, params).toParam();

    this.logger.debug(query);

    if (authorization) {
      return this.db.task(function *(task) {
        yield task.any(authorization.text, authorization.values);
        return yield task.any(query.text, query.values);
      });
    }

    return this.db.any(query.text, query.values);
  }
}

module.exports = Query;