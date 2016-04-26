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

var log = function (res) {
  console.log(res.body);
};

describe('Authentication/Authorization', function() {
  var token;

  before(function (done) {
    test.start({'authentication': {}, 'authorization': {}})
      .then(() => {
        return test.load(test.rootPath + 'sql/utils.sql');
      })
      .then(() => {
        return test.load(test.rootPath + 'sql/authentication.sql');
      })
      .then(() => {
        return test.load(test.rootPath + 'test/integration/bootstrap.sql');
      })
      .then(function() {
        done();
      })
      .catch((error) => {
        console.error(`exec error: ${error}`);
        done();
      });
  });

  it('POST /authenticate', function (done) {
    test.app.post('/authenticate')
      .set('Content-Type', 'application/json')
      .send({
        username: 'admin',
        password: 'admin'
      })
      .expect((res) => {
        var body = res.body;
        body.should.have.key('token');
        body.token.should.have.length(64);
        token = body.token;
      })
      .expect(200)
      .end(done);
  });

  it('POST /authenticate non existing user', function (done) {
    test.app.post('/authenticate')
      .set('Content-Type', 'application/json')
      .send({
        username: 'admin',
        password: 'ddddd'
      })
      .expect((res) => {
        var body = res.body;
        body.should.have.key('message');
        body.message.should.have.eq('Nobody found with this username/password');
      })
      .expect(401)
      .end(done);
  });

  it('GET /data/ip_data authorize', function (done) {
    test.app.get('/data/ip_data')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer ' + token)
      .expect([{ip_data:'192.168.100.128/25', host_data:'192.168.12.1', macaddr_data:'08:00:2b:01:02:03'}])
      .expect(200)
      .end(done);
  });

  it('GET /data/json_data wrong token', function (done) {
    test.app.get('/data/json_data')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer aaabbb7ead31cf6ff2df96a101f8bc35e3553e449a43e85d19af156e1f7638b7')
      .expect({"message": "Token does not exist"})
      .expect(401)
      .end(done);
  });

  it('POST /data/ip_data authorize', function (done) {
    test.app.post('/data/ip_data')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer ' + token)
      .send('{"ip_data":"192.168.100.128/25"}')
      .expect([{ip_data: '192.168.100.128/25', host_data: null, macaddr_data: null}])
      .expect(200)
      .end(done);
  });

  it('POST /data/json_data wrong token', function (done) {
    test.app.post('/data/json_data')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer aaabbb7ead31cf6ff2df96a101f8bc35e3553e449a43e85d19af156e1f7638b7')
      .send('{"json_data":{"toto":"blabla"}}')
      .expect({"message": "Token does not exist"})
      .expect(401)
      .end(done);
  });

  it('PATCH /data/string_data authorize', function (done) {
    test.app.patch('/data/string_data?char_short=eq.a')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer ' + token)
      .send('{"char_short":"b"}')
      .expect(log)
      .expect(200)
      .end(done);
  });

  it('PATCH /data/string_data wrong token', function (done) {
    test.app.patch('/data/string_data?char_short=eq.a')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer aaabbb7ead31cf6ff2df96a101f8bc35e3553e449a43e85d19af156e1f7638b7')
      .send('{"char_short":"b"}')
      .expect({"message": "Token does not exist"})
      .expect(401)
      .end(done);
  });

  it('DELETE /data/string_data authorize', function (done) {
    test.app.delete('/data/string_data?char_short=eq.a')
      .set('Authorization', 'Bearer ' + token)
      .expect(log)
      .expect(200)
      .end(done);
  });

  it('DELETE /data/string_data wrong token', function (done) {
    test.app.delete('/data/string_data?char_short=eq.a')
      .set('Authorization', 'Bearer aaabbb7ead31cf6ff2df96a101f8bc35e3553e449a43e85d19af156e1f7638b7')
      .expect({"message": "Token does not exist"})
      .expect(401)
      .end(done);
  });


  after(function (done) {
    test.stop(done);
  });
});
