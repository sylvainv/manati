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
    this.db = pgPromise(this.dsn);

    var router = require('./router')(this.db, this.logger);

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