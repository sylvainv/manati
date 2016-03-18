"use strict";

var _ = require('lodash');
var builder = require('./queryBuilder');

var buildOrderStatement = function(query, orders) {
  return orders.map(value => {
    let type = value.split('.');
    let name = type[0];
    let orderType = type[1].toLowerCase();

    if (orderType !== 'asc' && orderType !== 'desc') {
      throw new Error('Invalid order \'' + orderType + '\', valid values are \'desc\' or \'asc\'');
    }

    return query.order(name, orderType === 'asc');
  });
};

module.exports = function (db, logger) {
  var limit = '';

  return function *(table, params, callback) {
    var promise;
    // get the queried columns, remove the reserved words, as they are not columns
    var columns = _.keys(_.omit(params,
      'order', 'limit'
    ));

    // to prevent simple sql injection
    if (table.match(/;/)) {
      return Promise.reject(new Error('Syntax error'))
    }

    var query = builder.squel.select().from(table);

    // build order statement
    if (params.order !== undefined) {
      try {
        buildOrderStatement(query, params.order.split(','));
      }
      catch(error) {
        return Promise.reject(error);
      }
    }

    // build the limit statement
    if (params.limit !== undefined) {
      query.limit(parseInt(params.limit));
    }

    if (columns.length !== 0) {
      query.where(builder.buildWhereExpression(columns, params));
    }

    query = query.toString();
    promise = db.query(query);

    logger.debug(query);

    return promise.then(callback);
  };
};