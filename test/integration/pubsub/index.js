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

var test = new ManatiIntegrationTest();
const chance = require('chance').Chance();
const async = require('async');
const sprintf = require("sprintf-js").sprintf;
const http = require('http');
const net = require('net');
const WebSocket = require('ws');

var log = function (res) {
  console.log(res);
};

describe('Pub/Sub', function() {
  var token;

  before(function (done) {
    test.start()
      .then(() => {
        return test.load(test.rootPath + 'sql/utils.sql');
      })
      .then(() => {
        return test.load(test.rootPath + 'sql/authentication.sql');
      })
      .then(() => {
        return test.load(test.rootPath + 'sql/pubsub.sql');
      })
      .then(() => {
        return test.load(test.rootPath + 'test/integration/bootstrap.sql');
      })
      .then(function() {
        done();
      })
      .catch((error) => {
        console.error(error.stack);
        done();
      });
  });

  it('Websocket connect', function (done) {
    var port = test.app.server.address().port;
    var ws = new WebSocket('ws://localhost:' + port);

    ws.on('open', function onOpen() {
      // to receive notification of successfull watch
      test.app.db.query("SELECT manati_utils.notify_changes($1)", ['json_data']).then(function() {
        ws.on('message', function onMessage(data) {

          var data = JSON.parse(data);
          console.log(data);

          if (data.type === 'success') {
            test.app.db.query('INSERT INTO json_data (json_data, jsonb_data) VALUES ($1, $2)', [{'stuff': 'ss'}, {'www': 'www'}]);
          }
        });

        ws.send(JSON.stringify({
          action: 'listen',
          target: 'json_data',
          type: 'insert'
        }));
      });
    });
  });

  after(function (done) {
    test.stop(done);
  });
});
