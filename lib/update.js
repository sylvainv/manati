"use strict";
var _ = require('lodash');
var builder = require('./queryBuilder');

module.exports = function (db, logger) {

  return function *(table, data, params, callback) {
    if (_.isArray(data)) {
      return new Promise.reject('Cannot handle array insert at the moment');
    }

    var keys = _.keys(data);

    // keys must be valid strings
    try {
      keys.forEach(key => {
        if (null === key.match(/[a-zA-Z0-9]*/)) {
          throw new Error('Malformed column name: ' + key);
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

    var query = builder.squel.update().table(table);

    var columns = _.keys(params);

    if (columns.length === 0) {
      throw new Error('You need to pass query parameters to filter out the data, mass updating is not allowed');
    }

    query.where(builder.buildWhereExpression(columns, params));

    _.forIn(data, function (value, key) {
      query.set(key, value);
    });

    query.returning('*');

    query = query.toString();

    logger.debug(query);

    return db.many(query).then(callback);
  };
};
