"use strict";
var path = require('path');

var root = path.resolve(__dirname, '..');
var chai = require('chai');
chai.should();

global.manati_test_require = function(file) {
  return require(path.resolve(root, file))
};