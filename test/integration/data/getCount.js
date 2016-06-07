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

var test = new ManatiIntegrationTest(__dirname + '/../bootstrap.sql');
var chance = require('chance').Chance();

var log = function (res) {
  console.log(res.body);
};

describe('GET /data/count/:table/:count', function(done) {
  before(function (done) {
    test.start()
      .then(function () {
        done();
      })
      .catch((error) => {
        console.error(`exec error: ${error}`);
        console.error(error.stack);
        done();
      });
  });

  it('GET /data/count/uuid_data/uuid', function (done) {
    test.app.get('/data/count/uuid_data/uuid').expect((res) => {
      res.body['count'].should.be.eq('3');
    }).expect(200, done);
  });

  it('GET /data/count/dasdsasdsds/uuid', function (done) {
    test.app.get('/data/count/dasdsasdsds/uuid').expect(404, done);
  });

  after(function (done) {
    test.stop(done);
  });
});
