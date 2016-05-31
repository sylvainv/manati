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

describe('POST /data/:table', function(done) {
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

  it('GET /data/uuid_data', function (done) {
    test.app.get('/data/uuid_data').expect((res) => {
      res.body[0]['uuid'].should.be.a('string');
    }).expect(200, done);
  });

  it('GET /data/uuid_data invalid input for uuid', function (done) {
    test.app.get('/data/uuid_data?uuid=eq::2').expect((res) => {
      res.body['message'].should.be.eq('invalid input syntax for uuid: "2"')
    }).expect(400, done);
  });

  it('GET /data/uuid_data valid selection', function (done) {
    test.app.get('/data/uuid_data?uuid=eq::199F5EFB-2DF6-42CF-90D7-61D90212C74A').expect(200, done);
  });

  it('GET /data/number_data', function (done) {
    test.app.get('/data/number_data').expect((res) => {
      var data = res.body[0];
      data['smallint_number'].should.be.a('number');
      data['int_number'].should.be.a('number');
      data['bigint_number'].should.be.a('string');
      data['decimal_number'].should.be.a('string');
      data['numeric_number'].should.be.a('string');
      data['real_number'].should.be.a('number');
      data['double_number'].should.be.a('number');
    }).expect(200, done);
  });

  it('GET /data/string_data', function (done) {
    test.app.get('/data/string_data').expect((res) => {
      var data = res.body[0];
      data['char_short'].should.be.a('string');
      data['char_long'].should.be.a('string');
      data['string_short'].should.be.a('string');
      data['string_long'].should.be.a('string');
      data['string'].should.be.a('string');
      data['long_text'].should.be.a('string');
    }).expect(200, done);
  });

  it('GET /data/time_data', function (done) {
    test.app.get('/data/time_data').expect((res) => {
      var data = res.body[0];
      data['timestampz_data'].should.be.a('string');
      data['date_data'].should.be.a('string');
      data['time_data'].should.be.a('string');
      data['timez_data'].should.be.a('string');
      data['interval_data'].should.be.a('object');
    }).expect(200, done);
  });

  it('GET /data/misc_data', function (done) {
    test.app.get('/data/misc_data').expect((res) => {
      var data = res.body[0];
      data['money_data'].should.be.a('string');
      data['bool_data'].should.be.a('boolean');
      data['mood_data'].should.be.a('string');
      data['bit_data'].should.be.a('string');
    }).expect(200, done);
  });

  it('GET /data/ip_data', function (done) {
    test.app.get('/data/ip_data').expect((res) => {
      var data = res.body[0];
      data['ip_data'].should.be.a('string');
      data['host_data'].should.be.a('string');
      data['macaddr_data'].should.be.a('string');
    }).expect(200, done);
  });

  it('GET /data/json_data', function (done) {
    test.app.get('/data/json_data').expect((res) => {
      var data = res.body[0];
      data['json_data'].should.be.a('object');
      data['jsonb_data'].should.be.a('object');
    }).expect(200, done);
  });

  it('GET /data/range_data', function (done) {
    test.app.get('/data/range_data').expect((res) => {
      var data = res.body[0];
      data['int4range_data'].should.be.a('string');
      data['int8range_data'].should.be.a('string');
      data['numrange_data'].should.be.a('string');
      data['tsrange_data'].should.be.a('string');
      data['tstzrange_data'].should.be.a('string');
      data['daterange_data'].should.be.a('string');
    }).expect(200, done);
  });

  it('GET /data/non-existing-table', function (done) {
    test.app.get('/data/asdassdasa').expect(404, done);
  });

  after(function (done) {
    test.stop(done);
  });
});
