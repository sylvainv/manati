"use strict";

var pgErrorHandler = manati_test_require('lib/pgErrorHandler.js');

describe('pgErrorHandler', function () {
  it('pgErrorHandler("42P01") // table not found', function() {
    var error = pgErrorHandler({code: '42P01'});
    error.isBoom.should.be.true; // check it is a boom error
    error.output.statusCode.should.be.eq(404, 'It is not found error');
  });

  it('pgErrorHandler("ECONNREFUSED") // connection refused', function () {
    var error = pgErrorHandler({code: 'ECONNREFUSED'});
    error.isBoom.should.be.true; // check it is a boom error
    error.output.statusCode.should.be.eq(502, 'It is a bad gateway error');
  });

  it('pgErrorHandler("42089") // other errors', function () {
    var error = pgErrorHandler({code: '42089'});
    error.isBoom.should.be.true; // check it is a boom error
    error.output.statusCode.should.be.eq(400, 'It is a bad request error');
  });

  it('pgErrorHandler("90902") // unhandled errors', function () {
    var err = new Error('Some error');
    err.code = '90902';
    var error = pgErrorHandler(err);
    error.isBoom.should.be.true; // check it is a boom error
    error.output.statusCode.should.be.eq(500, 'It is an internal server error');
  });
});
