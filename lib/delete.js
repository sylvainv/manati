"use strict";
var _ = require('lodash');
var builder = require('./queryBuilder');
var Boom = require('boom');

module.exports = function (db, logger) {

  return function *(table, data, params, callback) {
    // to prevent sql injection
    if (table.match(/;/)) {
      return Promise.reject(new Error('Syntax error'))
    }

    var query = builder.squel.delete().from(table);

    var columns = _.keys(params);

    if (columns.length === 0) {
      throw Boom.badRequest('You need to pass query parameters to filter out the data, deleting the whole table' +
        ' content is not allowed');
    }

    query.where(builder.buildWhereExpression(columns, params));

    query.returning('*');

    query = query.toParam();
    
    logger.debug(query);

    return db.any(query.text, query.values).then(callback);
  };
};
