"use strict";

var cors = require('koa-cors');
var _ = require('lodash');
var Boom = require('boom');

var pgPromise = require('pg-promise')(/*options*/);

class App {
  constructor(options) {
    this.dsn = options.dsn;
    this.port = options.port;
    this.allowedOrigin = options.allowedOrigin;
    this.app = require('koa')();

    this.initLogger();

    this.initApp();
  }

  initLogger() {
    var bunyan = require('bunyan');
    this.logger = bunyan.createLogger({name: "pg-rest-api", streams: [
      {
        level: 'info',
        stream: process.stdout            // log INFO and above to stdout
      }
    ]});
  }

  initRouter() {
    var router = require('koa-router')();
    this.app.context.db = pgPromise(this.dsn);

    var fetchData = require('./lib/fetch')(this.app.context.db, this.logger);
    var addData = require('./lib/add')(this.app.context.db, this.logger);
    var updateData = require('./lib/update')(this.app.context.db, this.logger);

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

    this.app
      .use(router.routes())
      .use(router.allowedMethods({
        throw: true,
        notImplemented: () => new Boom.notImplemented(),
        methodNotAllowed: () => new Boom.methodNotAllowed()
      }));
  }

  initApp() {
    if (this.app.env !== 'production') {
      this.app.use(require('koa-logger')());
    }

    // CORS
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'OPTIONS']
    }));

    // PARSE BODY
    this.app.use(require('koa-parse-json')());

    // ERROR LOGGER
    this.app.on('error', function (err, ctx) {
      this.logger.error(err);
    });

    // ERROR HANDLER
    var self = this;
    this.app.use(function* errorHandler(next) {
      try {
        yield next;
      } catch (err) {
        var message;

        // if status is undefined and routine is defined, let's assume it's a postgresql error
        var pgError = require('./lib/pgErrorHandler')(err);
        self.logger.error(pgError);

        this.body = JSON.stringify(pgError.output.payload);
      }
    });

    this.initRouter();
  }

  start() {
    this.logger.info('Connecting to localhost:%d', this.port);
    this.app.listen(this.port);
  }
}

module.exports = function(config) {
  return new App(config);
};