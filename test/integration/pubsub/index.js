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
const Bluebird = require('bluebird');

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
        // to receive notification of successfull watch
        return test.app.db.query("SELECT manati_utils.notify_changes($1)", ['json_data']);
      })
      .then(() => {
        done();
      })
      .catch((error) => {
        console.error(error.stack);
        done();
      });
  });

  it('Listen to insert channel', function (done) {
    var port = test.app.server.address().port;
    var ws = new WebSocket('ws://localhost:' + port);

    ws.on('open', function onOpen() {
      ws.once('message', function onMessage(message) {
        message = JSON.parse(message);

        // if the action is listen, then insert data to test the notification
        message.should.have.keys(['action', 'channel']);
        message.action.should.be.eq('listen');
        message.channel.should.be.eq('insert__public__json_data');

        ws.once('message', function onMessage(data) {
          data = JSON.parse(data);

          try {
            data.should.have.keys(['schema', 'table', 'data', 'action']);
            data.action.should.be.eq('insert');
            data.schema.should.be.eq('public');
            data.table.should.be.eq('json_data');
            data.data.should.be.deep.eq({json_data: {'stuff': 'ss'}, jsonb_data: {'www': 'www'}});
          }
          catch(error) {
            return ws.emit('error', error);
          }

          ws.on('close', () => {
            done();
          });
          ws.close(1001);
        });

        test.app.db.query('INSERT INTO json_data (json_data, jsonb_data) VALUES ($1, $2)', [{'stuff': 'ss'}, {'www': 'www'}]);
      });

      ws.send(JSON.stringify({
        action: 'listen',
        target: 'json_data',
        type: 'insert'
      }));
    });
  });

  it('Listen to non existing table', function (done) {
    var port = test.app.server.address().port;
    var ws = new WebSocket('ws://localhost:' + port);

    ws.on('open', function onOpen() {
      ws.on('message', function onMessage(message) {
        message = JSON.parse(message);

        message.should.have.key('error');
        message.error.should.be.eq('relation "jsn_data" does not exist');

        ws.on('close', () => {
          done();
        });
        ws.close(1001);
      });

      ws.send(JSON.stringify({
        action: 'listen',
        target: 'jsn_data',
        type: 'insert'
      }));
    });
  });

  it('Several socket listening to insert channel', function (done) {
    var port = test.app.server.address().port;
    var ws1 = new WebSocket('ws://localhost:' + port);
    var ws2 = new WebSocket('ws://localhost:' + port);

    var promise1 = new Bluebird((resolve, reject) => {
      ws2.on('open', function onOpen() {
        ws2.once('message', function onMessage(message) {
          message = JSON.parse(message);

          message.should.have.keys(['action', 'channel']);
          message.action.should.be.eq('listen');
          message.channel.should.be.eq('insert__public__json_data');

          // listen for other message
          ws2.once('message', function onMessage(data) {
            data = JSON.parse(data);
            data.data.should.be.deep.eq({json_data: {'stuff': 'tt'}, jsonb_data: {'www': 'zzz'}});

            // close socket 2
            ws2.on('close', resolve);
            ws2.close(1001);
          });

          // insert a new record
          test.app.db.query('INSERT INTO json_data (json_data, jsonb_data) VALUES ($1, $2)', [{'stuff': 'tt'}, {'www': 'zzz'}]);
        });
      });
    });

    var promise2 = new Bluebird((resolve, reject) => {
      ws1.on('open', function onOpen() {
        ws1.once('message', function onMessage(message) {
          message = JSON.parse(message);

          message.should.have.keys(['action', 'channel']);
          message.action.should.be.eq('listen');
          message.channel.should.be.eq('insert__public__json_data');

          ws1.once('message', function onMessage(data) {
            data = JSON.parse(data);
            data.data.should.be.deep.eq({json_data: {'stuff': 'ss'}, jsonb_data: {'www': 'www'}});

            ws1.once('message', function onMessage(data) {
              data = JSON.parse(data);
              data.data.should.be.deep.eq({json_data: {'stuff': 'tt'}, jsonb_data: {'www': 'zzz'}});

              // close socket 1
              ws1.on('close', resolve);
              ws1.close(1001);
            });

            // start listen on other socket as well
            ws2.send(JSON.stringify({
              action: 'listen',
              target: 'json_data',
              type: 'insert'
            }));
          });

          test.app.db.query('INSERT INTO json_data (json_data, jsonb_data) VALUES ($1, $2)', [{'stuff': 'ss'}, {'www': 'www'}]);
        });

        ws1.send(JSON.stringify({
          action: 'listen',
          target: 'json_data',
          type: 'insert'
        }));
      });
    });

    Bluebird.all([promise1, promise2]).then(() => {
      done();
    });
  });

  after(function (done) {
    test.app._pubsub.stop();
    test.stop(done);
  });
});
