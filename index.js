"use strict";

var _ = require('lodash');
var Boom = require('boom');


var Insert = require('./lib/insert');


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
    var insertData = new Insert(this.db, this.logger);
    //var updateData = require('./lib/update')(this.koa.context.db, this.logger);
    //var deleteData = require('./lib/delete')(this.koa.context.db, this.logger);

    // TABLE
    router.param('table', function * checkTableIsNotInternal(table, next) {
      if (_.startsWith(table, 'pg_')) {
        throw Boom.forbidden('You cannot access internal tables.');
      }

      this.table = table;
      yield next;
    });

    router.post('/data/:table', function* addDataHandler() {
      if (!this.is('json')) {
        throw Boom.badRequest('Content-Type needs to be "application/json"');
      }

      this.body = yield insertData.query(this.table, this.request.body);
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

    // DELETE
    router.delete('/data/:table', function* deleteDataHandler() {
      this.body = yield deleteData(this.table, this.request.body, this.request.query);
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