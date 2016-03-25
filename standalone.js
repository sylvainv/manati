#!/usr/bin/env node
"use strict";

var _ = require('lodash');

var config = _.defaults(require('config'), {
  dsn: 'postgres://postgres@localhost:5432/postgres',
  port: 3000
});

var app = require('./index.js')(process.env.DATABASE_URL, config.get('allowed_origin'));
console.log('Running on',config.port);

app.init();
app.start(config.port);
