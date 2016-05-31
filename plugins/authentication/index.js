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

module.exports = function (dependencies, options) {
  var db = dependencies.db;

  var router = require('koa-router')();

  var options = _.defaults({
    procedure: "manati_auth.create_token($1, $2)",
    handler: function (data) {
      return {
        "token": data[0]['create_token']
      };
    }
  }, options);

  // POST
  router.post('/authenticate', function* authenticationHandler() {
    var params = this.request.body;
    this.body = yield db.any('SELECT ' + options.procedure, [params.username, params.password]).then(options.handler);
  });

  return router.routes();
};
