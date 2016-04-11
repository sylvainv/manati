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

const chance = require('chance').Chance();
const cp = require('child-process-es6-promise');
const pgp = require('pg-promise')();

class ManatiIntegrationTest {
  constructor() {
    this.databaseName = 'manati_test_' + chance.hash({length: 6});
    this.dsn = 'postgres://' + process.env.PGUSER + '@localhost/' + this.databaseName;
    this.should = require('chai').should();
  }

  start(done) {
    var self = this;
    // create db
    cp.exec('createdb --host=localhost --port=5432 --no-password --username=' + process.env.PGUSER + ' ' + this.databaseName)
      .then(() => {
        return pgp(self.dsn).query(new pgp.QueryFile(__dirname + '/bootstrap.sql'));
      })
      .then(() => {
        self.app = require('../../index.js')(this.dsn, 'info');
        self.app.init();

        // wrap the app for testing
        self.app = require('supertest-koa-agent')(self.app.koa);
      })
      .then(() => {done();})
      .catch((error) => {
        console.error(`exec error: ${error}`);
        done();
      });
  }

  stop(done) {
    // close connection
    pgp.end();

    // drop db
    cp.exec('dropdb --host=localhost --port=5432 --no-password --username=' + process.env.PGUSER + ' ' + this.databaseName)
      .then(() => {
        done();
      })
      .catch(error => {
        console.log(`exec error: ${error}`);
        done();
      });
  }
}

global.ManatiIntegrationTest = ManatiIntegrationTest;