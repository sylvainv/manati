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
    this.server = require('http').createServer(this.koa.callback());
    this.db = pgPromise(this.dsn);

    this.initLogger(logLevel);

    this.plugins = [];
    this.routers = {};
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

  addPlugin(plugin, attachRouter, options) {
    this.plugins.push({
      plugin: plugin({
        db: this.db,
        logger: this.logger
      }, options),
      router: attachRouter
    });
  }

  loadPlugins() {
    this.plugins.forEach(value => {
      var router;
      if (value.router !== undefined) {
        if (this.routers[value.router] === undefined) {
          throw new Error('Router ' + value.router + ' does not exist, available routers are: ' + _.keys(this.routers).join(', '));
        }
        router = this.routers[value.router];
      }
      else {
        router = this.koa;
      }

      if (value.position === 'first') {
        router.use(function* (next) {
          yield value.plugin;
          yield next;
        });
      }
      else {
        router.use(value.plugin);
      }
    })
  }

  initRouter() {
    this.routers.data = require('./lib/router/data')(this.db, this.logger);

    this.koa.use(this.routers.data.routes());
    this.koa.use(this.routers.data.allowedMethods({
      throw: true,
      notImplemented: () => new Boom.notImplemented(),
      methodNotAllowed: () => new Boom.methodNotAllowed()
    }));
  }

  init(options) {
    this.options = options || {};

    // PARSE BODY
    this.koa.use(require('koa-parse-json')());

    // SETUP PRE QUERIES, can be used in plugins
    this.koa.use(function* (next) {
      this.request.dbqueries = [];
      yield next;
    });

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

    // load the plugins if any
    this.loadPlugins();
  }

  start(port, host) {
    this.server.listen(port, host, () => {
      this.logger.info('Listening on %j', this.server.address());
    });
  }
}

module.exports = function(dsn, logLevel) {
  return new App(dsn, logLevel);
};