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
   * @param queries a number of queries to execute before or after
   * @returns {*}
   */
    query(table, data, params, queries) {
        var query = this.build(table, data, params).toParam();

        this.logger.debug(query);

        if (queries.length > 0) {
            return this.db.task(t => {
                var req = queries.map(q=>t.any(q.text, q.values));
                return t.batch(req)
                    .then(()=>t.any(query.text, query.values));
            });
        }

        return this.db.any(query.text, query.values);
    }
}

module.exports = Query;
