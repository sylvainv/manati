"use strict";
var _ = require('lodash');
var builder = require('./queryBuilder');
var Boom = require('boom');

module.exports = function (db, logger) {

  return function *(table, params, callback) {


    query = query.toParam();
    
    logger.debug(query);

    return db.any(query.text, query.values).then(callback);
  };
};

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
