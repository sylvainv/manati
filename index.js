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

  initAuthorization(dataRouter, options) {
    options = _.defaults({
      parseHeader: function (header) {
        return header.split('Bearer ')[1];
      },
      buildAuthorizationQuery: function (authorization) {
        // make sure authorization matches a specific pattern to avoid injection
        if (!authorization.match(/[a-f0-9]{64}/)) {
          throw Boom.badRequest('Invalid token');
        }

        return {
          text: 'select manati_auth.authorize($1);',
          values: [authorization]
        }
      }
    }, options);

    dataRouter.use(function* authorize(next) {
      var authorization = options.parseHeader(this.request.get('Authorization'));
      this.request.authorizationQuery = options.buildAuthorizationQuery(authorization);

      yield next;
    });
  }

  initRouter() {
    this.db = pgPromise(this.dsn);

    var data = require('./lib/router/data')(this.db, this.logger);

    if (this.options.authentication !== undefined) {
      var authentication = require('./lib/router/authentication')(this.db, this.logger, this.options['authentication']);
      this.koa.use(authentication.routes());
    }

    if (this.options.authorization !== undefined) {
      this.initAuthorization(data, this.options.authorization);
    }

    this.koa.use(data.routes());
    this.koa.use(data.allowedMethods({
      throw: true,
      notImplemented: () => new Boom.notImplemented(),
      methodNotAllowed: () => new Boom.methodNotAllowed()
    }));
  }

  init(options) {
    this.options = options || {};

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
        this.body = JSON.stringify({message: error.output.payload.message});
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