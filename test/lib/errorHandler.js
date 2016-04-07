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
"use strict"

var errorHandler = manati_test_require('lib/errorHandler.js');

describe('errorHandler', function () {
  it('errorHandler("42P01") // table not found', function() {
    var error = errorHandler({code: '42P01'});
    error.isBoom.should.be.true; // check it is a boom error
    error.output.statusCode.should.be.eq(404, 'It is not found error');
  });

  it('errorHandler("ECONNREFUSED") // connection refused', function () {
    var error = errorHandler({code: 'ECONNREFUSED'});
    error.isBoom.should.be.true; // check it is a boom error
    error.output.statusCode.should.be.eq(502, 'It is a bad gateway error');
  });

  it('errorHandler("42089") // other errors', function () {
    var error = errorHandler({code: '42089'});
    error.isBoom.should.be.true; // check it is a boom error
    error.output.statusCode.should.be.eq(400, 'It is a bad request error');
  });

  it('errorHandler("90902") // unhandled errors', function () {
    var err = new Error('Some error');
    err.code = '90902';
    var error = errorHandler(err);
    error.isBoom.should.be.true; // check it is a boom error
    error.output.statusCode.should.be.eq(500, 'It is an internal server error');
  });
});
