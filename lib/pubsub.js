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
var Bluebird = require('Bluebird');

const ACTIONS = ['listen', 'unlisten'];
const TYPES = ['insert', 'update', 'delete'];
const CHANNEL_SEPARATOR = '__';

class PubsubPgClient {
  constructor(logger, dsn, server) {
    this.logger = logger;
    this.dsn = dsn;
    this.server = server;
  }

  init() {
    this.pgClient = new pg.Client(this.dsn);
    this.pgClient.connect();
    this.channels = [];

    this.querySync = Bluebird.promisify(this.pgClient.query, {context: this.pgClient});

    // upon receiving notification from the db, broadcast it to subscribed sockets
    this.pgClient.on('notification', this.server.broadcast.bind(this.server));
  }

  unlisten(target, type) {
    this.logger.debug('Requesting to unlisten from channel for table ', target);

    return this.querySync({
      text: 'SELECT manati_utils.unlisten($1, $2);',
      values: [target, type]
    });
  }

  listen(target, type) {
    this.logger.debug('Requesting to listen to channel for table ', target);

    return this.querySync({
      text: 'SELECT manati_utils.listen($1, $2);',
      values: [target, type]
    });
  }

  end() {
    return this.pgClient.end();
  }
}

class PubsubSocket {
  constructor(logger, dsn, server, clients) {
    this.logger = logger;
    this.dsn = dsn;
    this.server = server;
    this.clients = clients;
  }

  init(socket) {
    this.socket = socket;

    // attach a pool of channels to this socket
    this.channels = [];

    // make sure all database connections for this socket are closed
    this.socket.on('close', () => {
      Bluebird.map(this.channels, value => {
        if (this.client !== undefined) {
          // send unlisten if the channel is not open somewhere else
          if (!this.server.isChannelOpen(value.channel)) {
            return this.client.unlisten(value.target, value.type).return(channel)
          }
        }

        return Promise.resolve(value.channel);
      }).each(channel => {
        this.removeChannel(channel);
      });
    });

    this.client = this.clients.pop();
    // if there is no authentication, then all user are the same and can use the same connection
    if (this.client === undefined) {
      this.logger.debug('New database client');

      // keep the client on the socket for future reference
      this.client = new PubsubPgClient(this.logger, this.dsn, this.server);
      this.client.init();
    }
    this.clients.push(this.client);
    this.logger.debug('Socket connected');

    // Upon receiving a message
    socket.on('message', this.onMessage.bind(this));
  }

  sendJSON(message) {
    this.socket.send(JSON.stringify(message), error => {
      if (error !== undefined) {
        this.logger.error('Sending socket message error %s', error.message);
      }
    });
  }

  removeChannel(channel) {
    // remove the channel from the pool of channel for this socket
    _.remove(this.channels, function (value) {
      return value.channel === channel
    });

    // remove it from the subscription list on the server
    this.server.removeFromChannelSubscriptionList(channel, this.socket);
  }


  addChannel(channel, target, type) {
    this.channels.push({channel: channel, target: target, type: type});

    this.server.addChannelToSubscriptionList(channel, this.socket);
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

  onMessage(message) {
    this.logger.debug('Watch message', message);

    // check the message is asking to watch a table, otherwise throw an error
    message = this.validateIncomingMessage(message);

    if (message.action === 'listen') {
      this.client.listen(message.target, message.type)
        .then((data) => {
          var channel = data.rows[0].listen;

          this.logger.debug('Listening to channel ', channel);
          // add channel to the list
          this.addChannel(channel, message.target, message.type);

          // send response message
          this.sendJSON({action: 'listen', channel: channel});
        })
        .catch(err => {
          this.logger.error(err);
          return this.sendJSON({error: err.message});
        });
    }
    else {
      // we specify true, to send a response back, saying we stop listening successfuly
      this.client.unlisten(message.target, message.type)
        .then(data => {
          var channel = data.rows[0].unlisten;

          this.logger.debug('Unlistening from channel ', channel);
          // add channel to the list
          this.removeChannel(channel);
        })
        .then(channel => {
          // send response message
          return this.sendJSON({action: 'unlisten', channel: channel});
        });
    }
  }
}

class PubSubServer {
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
    // Upon receiving a socket connection
    this.server.on('connection', (ws) => {
      var socket = new PubsubSocket(this.logger, this.dsn, this, this.clientPool);
      socket.init(ws);
    });
  }

  /**
   * Broadcast channel info
   * @param data
   */
  broadcast(data) {
    // broadcast info to all subscribed clients
    let info = data.channel.split(CHANNEL_SEPARATOR, 3);

    this.subscriptions[data.channel].forEach(socket => {
      socket.send(JSON.stringify({
        action: info[0],
        schema: info[1],
        table: info[2],
        data: JSON.parse(data.payload)
      }));
    });
  }

  isChannelOpen(channel) {
    return this.subscriptions[channel] !== undefined && this.subscriptions[channel].length > 0;
  }

  removeFromChannelSubscriptionList(channel, socket) {
    // remove this websocket from this channel subscription
    if (this.subscriptions[channel] !== undefined) {
      _.remove(this.subscriptions[channel], function (s) {
        return s === socket;
      });
    }
  }

  addChannelToSubscriptionList(channel, socket) {
    // keep recording which sockets listens to which channel
    if (this.subscriptions[channel] === undefined) {
      this.subscriptions[channel] = [];
    }
    this.subscriptions[channel].push(socket);
  }

  stop() {
    this.logger.debug('Stopping all PostgreSQL client');
    this.clientPool.forEach(client => {
      client.end();
    });
  }
}

module.exports = function(server, db, dsn, logger) {
  var pubsub = new PubSubServer(server, db, dsn, logger);
  pubsub.init();
  return pubsub;
};