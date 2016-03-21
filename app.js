"use strict";

var cors = require('koa-cors');
var _ = require('lodash');
var Boom = require('boom');

var pgPromise = require('pg-promise')(/*options*/);

class App {
  constructor(dsn, allowedOrigin) {
    this.dsn = dsn;
    this.allowedOrigin = allowedOrigin;
    this.server = require('koa')();

    this.initLogger();
    this.init();
  }

  initLogger() {
    var bunyan = require('bunyan');
    this.logger = bunyan.createLogger({name: "manati", streams: [
      {
        level: 'info',
        stream: process.stdout            // log INFO and above to stdout
      }
    ]});
  }

  initRouter() {
    var router = require('koa-router')();
    this.server.context.db = pgPromise(this.dsn);

    var fetchData = require('./lib/fetch')(this.server.context.db, this.logger);
    var addData = require('./lib/add')(this.server.context.db, this.logger);
    var updateData = require('./lib/update')(this.server.context.db, this.logger);

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

    this.server
      .use(router.routes())
      .use(router.allowedMethods({
        throw: true,
        notImplemented: () => new Boom.notImplemented(),
        methodNotAllowed: () => new Boom.methodNotAllowed()
      }));
  }

  init() {
    if (this.server.env !== 'production' || this.server.env !== 'prod') {
      this.server.use(require('koa-logger')());
    }

    // CORS
    this.server.use(cors({
      origin: this.allowedOrigin,
      methods: ['GET', 'POST', 'PATCH', 'OPTIONS']
    }));

    // PARSE BODY
    this.server.use(require('koa-parse-json')());

    // ERROR LOGGER
    this.server.on('error', function (err, ctx) {
      this.logger.error(err);
    });

    var self = this;
    // ERROR HANDLER
    this.server.use(function* errorHandler(next) {
      try {
        yield next;
      } catch (err) {
        self.logger.error(err);

        // if status is undefined and routine is defined, let's assume it's a postgresql error
        var error = require('./lib/pgErrorHandler')(err);

        this.status = error.output.statusCode;
        this.body = error.output.payload;
      }
    });

    this.initRouter();
  }
}

module.exports = function(dsn, allowedOrigin) {
  return new App(dsn, allowedOrigin);
};