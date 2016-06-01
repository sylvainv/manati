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
var path = require('path');

var pgPromise = require('pg-promise')({
  'pgFormatting': true
});

class App {
  constructor(dsn) {
    this.dsn = dsn;
    this.koa = require('koa')();
    this.server = require('http').createServer(this.koa.callback());
    this.db = pgPromise(this.dsn);

    this.plugins = [];
    this.routers = {};
  }

  addPlugin(plugin, attachRouter, options) {
    if (typeof plugin !== "function") {
      plugin = require(path.resolve(path.join(__dirname,'plugins', plugin)));
    }

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

      router.use(value.plugin);
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

  initDefaultLogger(streams, logLevel) {
    if (streams === undefined || !_.isArray(streams) || (_.isArray(streams) && streams.length === 0)) {
      streams = [{
        level: logLevel || 'info',
        stream: process.stdout            // log INFO and above to stdout
      }
      ];
    }
    this.logger = require('bunyan').createLogger({name: "manati", streams: streams});
  }

  /**
   *
   * @param options an object to pass options
   *   logger: if you don't want to use the default logger
   */
  init(options) {
    this.options = options || {};
    _.defaults(this.options, {logLevel: 'info', logRequest: true});

    this.initDefaultLogger(this.options.logStreams, this.options.logLevel);

    // set logger in the koa context
    var logger = this.logger;
    this.koa.use(function* (next) {
      this.logger = logger;
      yield next;
    });

    if (this.options.logRequest) {
      this.koa.use(function* (next) {
        this.logger.info('%s %s', this.request.method.toUpperCase(), this.request.path);
        yield next;
      });
    }

    // PARSE BODY
    this.koa.use(require('koa-parse-json')());

    // SETUP PRE QUERIES, can be used in plugins
    this.koa.use(function* (next) {
      this.request.dbqueries = [];
      yield next;
    });

    var koa = this.koa;
    // ERROR HANDLER
    this.koa.use(function* errorHandler(next) {
      try {
        yield next;
      } catch (err) {
        this.logger.error(err);

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