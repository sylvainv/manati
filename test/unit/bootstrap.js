"use strict";
var path = require('path');

var root = path.resolve(__dirname, '..', '..');
var chai = require('chai');

global.should = chai.should();

global.manati_test_require = function(file) {
  return require(path.resolve(root, file))
};
