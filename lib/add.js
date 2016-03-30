"use strict";
var _ = require('lodash');
var builder = require('./queryBuilder');

module.exports = function (db, logger) {
  return function *(table, data, callback) {

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
    catch(error) {
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

    query = query.toParam();
    logger.debug(query);

    return db.any(query.text, query.values).then(callback);
  };
};