#!/usr/bin/env node
"use strict";

var _ = require('lodash');

var cors = require('koa-cors');

var config = _.defaults(require('config'), {
  dsn: 'postgres://postgres@localhost:5432/postgres',
  port: 3000
});

var app = require('./index.js')(
  process.env.DATABASE_URL,
  process.env.LOG_LEVEL
);

// CORS
app.koa.use(cors({
  origin: config.get('allowed_origin'),
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
}));

app.init();
app.start(config.port);
