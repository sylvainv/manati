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
const chance = require('chance').Chance();
const async = require('async');
const sprintf = require("sprintf-js").sprintf;

var log = function (res) {
  console.log(res.body);
};

var checkLength = function(route, length) {
  return function(cb) {
    test.app.get(route).expect((res) => {
      res.body.should.have.length(length);
    }).expect(200).end(cb);
  };
};

describe('POST /data/:table', function (done) {
  before(function (done) {
    test.start()
      .then(function () {
        done();
      })
      .catch((error) => {
        console.error(`exec error: ${error}`);
        done();
      });
  });

  it('POST /data/uuid_data', function (done) {
    var uuid = chance.guid();

    async.series([
      function(cb) {test.app.post('/data/uuid_data')
        .set('Content-Type', 'application/json')
        .send({
          uuid: uuid
        })
        .expect(200, [{uuid: uuid}]).end(cb);
      },
      // check there are 4 uuids in database now
      checkLength('/data/uuid_data', 4)
    ], done);
  });

  it('POST /data/number_data', function (done) {
    async.series([
      function (cb) {
        test.app.post('/data/number_data')
          .set('Content-Type', 'application/json')
          .send({
            'smallint_number': 1,
            'int_number': 289890989,
            'bigint_number': 123456789098765,
            'decimal_number': 4.98765678,
            'numeric_number': 5.7656789,
            'real_number': 6.767890,
            'double_number': 7.90876546789
          })
          .expect(200, [{
            smallint_number: 1,
            int_number: 289890989,
            bigint_number: '123456789098765',
            decimal_number: '4.98765678',
            numeric_number: '5.7656789',
            real_number: 6.76789,
            double_number: 7.90876546789
          }])
          .end(cb);
      },
      // check there are 4 uuids in database now
      checkLength('/data/number_data', 3)
    ], done);
  });

  it('POST /data/string_data', function (done) {
    var data;

    async.series([
      function (cb) {
        test.app.post('/data/string_data')
          .set('Content-Type', 'application/json')
          .send(data = {
            'char_short': chance.character(),
            'char_long': chance.word({length: 5}),
            'string_short': chance.character(),
            'string_long': chance.word({length: 5}),
            'string': chance.paragraph({sentences: 5}),
            'long_text': chance.paragraph({sentences: 30})
          })
          .expect(200, [data])
          .end(cb);
      },
      // check there are 4 uuids in database now
      checkLength('/data/string_data', 2)
    ], done);
  });

  it('POST /data/time_data', function (done) {
    async.series([
      function (cb) {
        test.app.post('/data/time_data')
          .set('Content-Type', 'application/json')
          .send({
            timestampz_data: '2022-01-13T20:26:04.697Z',
            date_data: '2068-04-18T00:00:00.000Z',
            time_data: '04:25:59',
            timez_data: '09:33:20+00',
            interval_data: '79 years 2 months 16 days 12 hours 9 minutes 7 seconds'
          })
          .expect(200, [{
            timestampz_data: '2022-01-13T20:26:04.697Z',
            date_data: '2068-04-18T00:00:00.000Z',
            time_data: '04:25:59',
            timez_data: '09:33:20+00',
            interval_data: {years: 79, months: 2, days: 16, hours: 12, minutes: 9, seconds: 7}
          }])
          .end(cb);
      },
      // check there are 4 uuids in database now
      checkLength('/data/time_data', 3)
    ], done);
  });

  it('POST /data/misc_data', function (done) {
    var data;

    async.series([
      function (cb) {
        test.app.post('/data/misc_data')
          .set('Content-Type', 'application/json')
          .send(data = {
            'money_data': chance.dollar({max:999}),
            'bool_data': chance.bool(),
            'mood_data': chance.pickset(['sad', 'ok', 'happy'], 1)[0],
            'bit_data': '101'
          })
          .expect(200, [data])
          .end(cb);
      },
      // check there are 4 uuids in database now
      checkLength('/data/time_data', 3)
    ], done);
  });

  it('POST /data/ip_data', function (done) {
    var data;

    async.series([
      function (cb) {
        test.app.post('/data/ip_data')
          .set('Content-Type', 'application/json')
          .send(data = {
            'macaddr_data': chance.mac_address().toLowerCase(),
            'ip_data': chance.ip() + '/32',
            'host_data': chance.ip()
          })
          .expect(200, [data])
          .end(cb);
      },
      // check there are 4 uuids in database now
      checkLength('/data/ip_data', 2)
    ], done);
  });

  it('POST /data/json_data', function (done) {
    var data;

    async.series([
      function (cb) {
        test.app.post('/data/json_data')
          .set('Content-Type', 'application/json')
          .send(data = {
            'json_data': {"string": chance.paragraph(), "number": chance.integer(), "float": chance.floating(), "boolean": chance.bool()},
            'jsonb_data': {"string": chance.paragraph(), "number": chance.integer(), "float": chance.floating(), "boolean": chance.bool()},
          })
          .expect(200, [data])
          .end(cb);
      },
      // check there are 4 uuids in database now
      checkLength('/data/json_data', 2)
    ], done);
  });

  after(function (done) {
    test.stop(done);
  });
});
