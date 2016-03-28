"use strict";

var cors = require('koa-cors');
var _ = require('lodash');
var Boom = require('boom');

var pgPromise = require('pg-promise')(/*options*/);

class App {
  constructor(dsn, allowedOrigin) {
    this.dsn = dsn;
    this.allowedOrigin = allowedOrigin;
    this.koa = require('koa')();

    this.initLogger();
  }

  initLogger() {
    var bunyan = require('bunyan');
    this.logger = bunyan.createLogger({name: "manati", streams: [
      {
        level: process.env.NODE_LOG_LEVEL || 'info',
        stream: process.stdout            // log INFO and above to stdout
      }
    ]});
  }

  initRouter() {
    var router = require('koa-router')();
    this.koa.context.db = pgPromise(this.dsn);

    var fetchData = require('./lib/fetch')(this.koa.context.db, this.logger);
    var addData = require('./lib/add')(this.koa.context.db, this.logger);
    var updateData = require('./lib/update')(this.koa.context.db, this.logger);

    // TABLE
    router.param('table', function * checkTableIsNotInternal(table, next) {
      if (_.startsWith(table, 'pg_')) {
        throw Boom.forbidden('You cannot access internal tables.');
      }

      this.table = table;
      yield next;
    });

    // GET
    router.get('/data/:table', function* fetchDataHandler() {
      this.body = yield fetchData(this.table, this.request.query);
    });

    // POST
    router.post('/data/:table', function* addDataHandler() {
      if (!this.is('json')) {
        throw Boom.badRequest('Content-Type needs to be "application/json"');
      }

      this.body = yield addData(this.table, this.request.body, this.request.query);
    });

    // PATCH
    router.patch('/data/:table', function* updateDatahandler() {
      if (!this.is('json')) {
        throw Boom.badRequest('Content-Type needs to be "application/json"');
      }

      this.body = yield updateData(this.table, this.request.body, this.request.query);
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
    if (this.koa.env !== 'production' || this.koa.env !== 'prod') {
      this.koa.use(require('koa-logger')());
    }

    // CORS
    this.koa.use(cors({
      origin: this.allowedOrigin,
      methods: ['GET', 'POST', 'PATCH', 'OPTIONS']
    }));

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

        var error = require('./lib/pgErrorHandler')(err);

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

module.exports = function(dsn, allowedOrigin) {
  return new App(dsn, allowedOrigin);
};