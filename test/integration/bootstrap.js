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
  constructor(sqlFile) {
    this.databaseName = 'manati_test_' + chance.hash({length: 6});
    this.dsn = 'postgres://' + process.env.PGUSER + '@localhost/' + this.databaseName;
    this.should = require('chai').should();
    this.sqlFile = sqlFile;
    this.rootPath = __dirname + '/../../';
    this.port = process.env.PGPORT || 5432;
  }

  start(options) {
    var self = this;

    this.db = pgp(this.dsn);

    // create db
    return cp.exec('createdb --host=localhost --port=' + self.port + ' --no-password --username=' + process.env.PGUSER + ' ' + this.databaseName)
      .then(() => {
        if (self.sqlFile === undefined) {
          return Promise.resolve();
        }

        return self.load(self.sqlFile);
      })
      .then(() => {
        self.app = require(self.rootPath + 'index.js')(this.dsn, 'info');
        self.app.init(options);

        // wrap the app for testing
        self.app = require('supertest-koa-agent')(self.app.koa);

        return Promise.resolve();
      });
  }

  query(query) {
    return this.db.any(query);
  }

  load(sqlFile) {
    return this.db.any(new pgp.QueryFile(sqlFile, {minify: true}));
  }

  stop(done) {
    // close connection
    pgp.end();

    // drop db
    cp.exec('dropdb --host=localhost --port=' + this.port + ' --no-password --username=' + process.env.PGUSER + ' ' + this.databaseName)
      .then(() => {
        done();
      })
      .catch(err => {
        console.log(`exec error ${err}`);
        done();
      });
  }
}

global.ManatiIntegrationTest = ManatiIntegrationTest;