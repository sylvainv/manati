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

var Insert = require('./../insert');
var Select = require('./../select');
var Update = require('./../update');
var Delete = require('./../delete');
var _ = require('lodash');

module.exports = function(db, logger) {
  var router = require('koa-router')({'prefix': '/data'});

  var insert = new Insert(db, logger);
  var select = new Select(db, logger);
  var update = new Update(db, logger);
  var delet = new Delete(db, logger);

  // TABLE
  router.param('table', function * checkTableIsNotInternal(table, next) {
    if (_.startsWith(table, 'pg_')) {
      throw Boom.forbidden('You cannot access internal tables.');
    }

    // to prevent sql injection
    if (table.match(/;/)) {
      return Boom.badRequest('Syntax error');
    }

    this.table = table;
    yield next;
  });

  // GET
  router.get('/:table', function* fetchDataHandler() {
    this.body = yield select.query(this.table, {}, this.request.query, this.req.restricted, this.req.authorizationQuery);
  });

  // POST
  router.post('/:table', function* addDataHandler() {
    if (!this.is('json')) {
      throw Boom.badRequest('Content-Type needs to be "application/json"');
    }

    this.body = yield insert.query(this.table, this.request.body, {}, this.req.restricted, this.req.authorizationQuery);
  });

  // PATCH
  router.patch('/:table', function* updateDatahandler() {
    if (!this.is('json')) {
      throw Boom.badRequest('Content-Type needs to be "application/json"');
    }

    this.body = yield update.query(this.table, this.request.body, this.request.query, this.req.restricted, this.req.authorizationQuery);
  });

  // DELETE
  router.delete('/:table', function* deleteDataHandler() {
    this.body = yield delet.query(this.table, {}, this.request.query, this.req.restricted, this.req.authorizationQuery);
  });

  return router;
};
