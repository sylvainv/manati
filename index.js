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
var Boom = require('boom');


var Insert = require('./lib/insert');
var Select = require('./lib/select');
var Update = require('./lib/update');
var Delete = require('./lib/delete');

var pgPromise = require('pg-promise')({
  'pgFormatting': true
});

class App {
  constructor(dsn, logLevel) {
    this.dsn = dsn;
    this.koa = require('koa')();

    this.initLogger(logLevel);
  }

  initLogger(logLevel) {
    var bunyan = require('bunyan');
    this.logger = bunyan.createLogger({name: "manati", streams: [
      {
        level: logLevel || 'info',
        stream: process.stdout            // log INFO and above to stdout
      }
    ]});
  }

  initRouter() {
    var router = require('koa-router')();
    this.db = pgPromise(this.dsn);

    //var fetchData = require('./lib/fetch')(this.koa.context.db, this.logger);
    var insert = new Insert(this.db, this.logger);
    var select = new Select(this.db, this.logger);
    var update = new Update(this.db, this.logger);
    var delet = new Delete(this.db, this.logger);

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

    // POST
    router.post('/data/:table', function* addDataHandler() {
      if (!this.is('json')) {
        throw Boom.badRequest('Content-Type needs to be "application/json"');
      }

      this.body = yield insert.query(this.table, this.request.body);
    });

    // GET
    router.get('/data/:table', function* fetchDataHandler() {
      this.body = yield select.query(this.table, this.request.query);
    });

    // PATCH
    router.patch('/data/:table', function* updateDatahandler() {
      if (!this.is('json')) {
        throw Boom.badRequest('Content-Type needs to be "application/json"');
      }

      this.body = yield update.query(this.table, this.request.body, this.request.query);
    });

    // DELETE
    router.delete('/data/:table', function* deleteDataHandler() {
      this.body = yield delet.query(this.table, this.request.query);
    });

    this.koa
      .use(router.routes())
      .use(router.allowedMethods({
        throw: true,
        notImplemented: () => new Boom.notImplemented(),
        methodNotAllowed: () => new Boom.methodNotAllowed()
      }));
  }

  init() {
    // PARSE BODY
    this.koa.use(require('koa-parse-json')());

    var koa = this.koa;
    var self = this;
    // ERROR HANDLER
    this.koa.use(function* errorHandler(next) {
      try {
        yield next;
      } catch (err) {
        self.logger.error(err);

        var error = require('./lib/errorHandler')(err);

        this.status = error.output.statusCode;
        this.type = 'json';
        this.body = JSON.stringify(error.output.payload);
      }
    });

    this.initRouter();
  }

  start(port) {
    this.koa.listen(port);
  }
}

module.exports = function(dsn, logLevel) {
  return new App(dsn, logLevel);
};