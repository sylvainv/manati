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

var test = new ManatiIntegrationTest(); //defaults to above if env variables are used

describe('ALL /data/:table', function() {

  before(function(done) {
    test.start(done);
  });

  describe('GET /data/:table', function(done) {
    it('GET /data/:table', function (done) {
      test.app.get('/data/json_data').expect(200, done);
    });
  });

  after(function(done) {
    test.stop(done);
  });
});