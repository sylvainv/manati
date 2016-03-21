#!/usr/bin/env node
"use strict";

var _ = require('lodash');

var config = _.defaults(require('config'), {
  dsn: 'postgres://postgres@localhost:5432/postgres',
  port: 3000
});

var app = require('./index.js')(config.get('dsn'), config.get('allowed_origin'));
console.log('Running on',config.port);

app.start(config.port);
