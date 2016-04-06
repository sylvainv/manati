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

/**
 * Build an insert query
 * @param table name of the table
 * @param data json object
 * @returns squel.Query
 */
var build = function(table, data) {
  if (_.isArray(data)) {
    var error = new Error('Cannot handle array insert at the moment');
    error.status = 400;
    throw error;
  }

  if (_.isEmpty(data)) {
    var error = new Error('Nothing to insert');
    error.status = 400;
    throw error;
  }

  var keys = _.keys(data);

  // keys must be valid strings
  try {
    keys.forEach(key => {
      if (null === key.match(/[a-zA-Z0-9_]*/)) {
        var error = new Error('Malformed column name: ' + key);
        error.status = 400;
        throw error;
      }
    });
  }
  catch (error) {
    return Promise.reject(error);
  }

  // to prevent sql injection
  if (table.match(/;/)) {
    return Promise.reject(new Error('Syntax error'))
  }

  var query = builder.squel.insert().into(table);
  if (_.isArray(data)) {
    query.setFieldsRows(data);
  }
  else {
    query.setFields(data);
  }

  query.returning('*');

  return query;
};

/**
 * Generator to insert data into the database
 * @param table name of the table
 * @param data json object
 * @param callback callback
 * @returns {Promise.<T>}
 */
var generator = function *(table, data, callback) {
  var query = build(table, data).toParam();

  this.logger.debug(query);

  return db.any(query.text, query.values).then(callback);
};

module.exports = function Insert(db, logger) {
  this.db = db;
  this.logger = logger;

  this.generator = generator;
  this.build = build;
};