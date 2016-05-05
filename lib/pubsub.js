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
var ws = require('ws');

const ACTIONS = ['listen', 'unlisten'];
const TYPES = ['insert', 'update', 'delete'];

class PubSub {
  constructor(websocketServer, db, dsn, logger) {
    this.server = websocketServer;
    this.db = db;
    this.dsn = dsn;
    this.logger = logger;

    // because connection have to be kept alive, we handle our own connection pool specific to this use case
    this.clientPool = [];

    // keep which socket is subscribed to what channel, indexed by channel
    this.subscriptions = {};
  }

  init() {
    this.server.on('headers', headers => {
      this.logger.debug(headers);
    });

    // Upon receiving a socket connection
    this.server.on('connection', ws => {
      // attach a pool of channels to this socket
      ws.channels = [];

      // make sure all database connections for this socket are closed
      ws.on('close', () => {
        ws.channels.forEach(value => {
          this.unlisten(ws, ws.pgClient, value);
        });
      });

      let client = this.clientPool.pop();
      // if there is no authentication, then all user are the same and can use the same connection
      this.logger.debug('Socket connected, using client %s', client);
      if (client === undefined) {
        this.logger.debug('New database client');

        client = new pg.Client(this.dsn);
        client.connect();
        this.clientPool.push(client);

        // keep the client on the socket
        ws.pgClient = client;

        client.on('notification', data => {
          this.logger.debug('Notification received, broadcasting', data);

          // broadcast info to all subscribed clients
          let info = data.channel.split('__', 3);

          this.subscriptions[data.channel].forEach(socket => {
            socket.send(JSON.stringify({
              action: info[0],
              schema: info[1],
              table: info[2],
              data: JSON.parse(data.payload)
            }));
          });
        });
      }

      // Upon receiving a message
      ws.on('message', message => {
        this.logger.debug('Watch message', message);

        // check the message is asking to watch a table, otherwise throw an error
        message = this.validateIncomingMessage(message);

        this.handleActionMessage(ws, client, message);
      });
    });

    this.server.on('error', error => {
      this.logger.error(error);
    });
  }

  handleActionMessage(ws, client, message) {
    if (message.action === 'listen') {
      this.listen(ws, client, message);
    }
    else {
      this.unlisten(ws, client, message);
    }
  }

  listen(ws, client, message) {
    this.logger.debug('Requesting to listen to channel for table ', message.target);

    client.query({
      text: 'SELECT manati_utils.listen($1, $2);',
      values: [message.target, message.type]
    }, (err, data) => {
      if (err) {
        ws.send(JSON.stringify({error: err.message}));
        return;
      }

      var channel = data.rows[0].listen;
      ws.channels.push({channel: channel, target: message.target, type: message.type});

      this.logger.debug('Listening to channel ', channel);

      // keep recording which sockets listens to which channel
      if (this.subscriptions[channel] === undefined) {
        this.subscriptions[channel] = [];
      }
      this.subscriptions[channel].push(ws);

      // send response message
      ws.send(JSON.stringify({action: 'listen', channel: channel}));
    });
  }

  unlisten(ws, client, message) {
    this.logger.debug('Requesting to unlisten to channel for table ', message.target);

    client.query({
      text: 'SELECT manati_utils.unlisten($1, $2);',
      values: [message.target, message.type]
    }, (err, data) => {
      if (err) {
        throw err;
      }

      var channel = data.rows[0].unlisten;
      this.logger.debug('Unlistening to channel ', channel);

      // remove the channel from the pool of channel for this socket
      _.remove(ws.channels, function(value) {return value.channel === channel});

      // remove this websocket from this channel subscription
      if (this.subscriptions[channel] !== undefined) {
        _.remove(this.subscriptions[channel], function(socket) {
          return socket === ws;
        });
      }

      // send response message
      ws.send(JSON.stringify({action: 'unlisten', channel: channel}));
    });
  }

  handleActionResponseCallback(err, data) {
    if (err) {
      throw err;
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

  stop() {
    this.clientPool.forEach(client => {
      client.end();
    });
  }
}

module.exports = function(server, db, dsn, logger) {
  var pubsub = new PubSub(server, db, dsn, logger);
  pubsub.init();
  return pubsub;
};