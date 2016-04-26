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

var Select = manati_test_require('lib/select.js');

describe('select', function () {
  it('select::build() with simple query', function() {
    var select = new Select();
    var query = select.build('table', {}, {"number": '1', "string": "string", "float": '1.22'});
    query = query.toParam();

    query.text.should.be.equal("SELECT * FROM table WHERE (number = $1 AND string = $2 AND float = $3)");
    query.values.should.be.deep.equal(['1','string', '1.22']);
  });

  it('select::build() with limit and order', function () {
    var select = new Select();
    var query = select.build('table', {}, {
      "number": '1', "string": "string", "float": '1.22',
      "limit": 2, "order": "desc::number"
    });
    query = query.toParam();

    query.text.should.be.equal("SELECT * FROM table WHERE (number = $1 AND string = $2 AND float = $3) ORDER BY" +
      " number DESC LIMIT 2");
    query.values.should.be.deep.equal(['1', 'string', '1.22']);
  });

  it('select::build() with limit and 2 orders', function () {
    var select = new Select();
    var query = select.build('table', {}, {
      "number": '1', "string": "string", "float": '1.22',
      "limit": 2, "order": "desc::number,asc::float"
    });
    query = query.toParam();

    query.text.should.be.equal("SELECT * FROM table WHERE (number = $1 AND string = $2 AND float = $3) ORDER BY" +
      " number DESC, float ASC LIMIT 2");
    query.values.should.be.deep.equal(['1', 'string', '1.22']);
  });

  it('select::build() with limit and wrong orders', function () {
    var select = new Select();

    select.build.bind(select, 'table', {}, {
      "number": '1', "string": "string", "float": '1.22',
      "limit": 2, "order": "equal::number,asc::float"
    }).should.throw("Invalid order 'equal', valid values are 'desc' or 'asc'");
  });
});
