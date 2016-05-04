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
var pg = require('pg');

const ACTIONS = ['listen', 'unlisten'];
const TYPES = ['insert', 'update', 'delete'];

class PubSub {
  constructor(websocketServer, db, dsn, logger) {
    this.server = websocketServer;
    this.db = db;
    this.dsn = dsn;
    this.logger = logger;
  }

  init() {
    // Upon receiving a socket connection
    this.server.on('connection', ws => {
      this.ws = ws;

      // Upon receiving a message
      ws.on('message', message => {
        // check the message is asking to watch a table, otherwise throw an erro
        message = this.validateIncomingMessage(message);

        // Upon connecting to the database
        pg.connect(this.dsn, (error, client) => {
          client.on('notification', data => {
            this.logger.debug('Notification received: %s', data);
            data = JSON.parse(data);
            ws.send(data.payload);
          });

          if (message.action === 'listen') {
            this.listen(client, message);
          }
          else {
            this.unlisten(client, message);
          }
        });
      });
    });
  }

  listen(client, message) {
    var ws = this.ws;
    client.query({
      text: 'SELECT manati_utils.listen($1, $2);',
      values: [message.target, message.type]
    }, this.handleActionResponseCallback.bind(ws));
  }

  unlisten(client, message) {
    var ws = this.ws;
    client.query({
      text: 'SELECT manati_utils.unlisten($1, $2);',
      values: [message.target, message.type]
    }, this.handleActionResponseCallback.bind(ws));
  }

  handleActionResponseCallback(err, data) {
    if (err) {
      this.send(JSON.stringify({
        error: err.message
      }));
    }
    else {
      this.send(JSON.stringify(
        data.rows[0]
      ));
    }
  }

  validateIncomingMessage(message) {
    message = JSON.parse(message);

    this.logger.info(message);

    if (message.action === undefined) {
      throw Error('Specify an action parameter, possible actions are ' + ACTIONS.join(', '));
    }

    if (!_.includes(ACTIONS, message.action)) {
      throw Error('Specify an action parameter, possible actions are ' + ACTIONS.join(', '));
    }

    if (message.target === undefined) {
      throw Error('Specify a target parameter, possible target are any tables or view you have read access on.');
    }

    if (message.type === undefined) {
      throw Error('Specify a type parameter, possible types are ' + TYPES.join(', '));
    }

    if (!_.includes(TYPES, message.type)) {
      throw Error('Specify a type parameter, possible types are ' + TYPES.join(', '));
    }

    return message;
  }
}

module.exports = function(server, db, dsn, logger) {
  var pubsub = new PubSub(server, db, dsn, logger);
  pubsub.init();
  return pubsub;
};