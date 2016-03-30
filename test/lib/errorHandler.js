"use strict";

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
