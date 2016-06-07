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

var Count = manati_test_require('lib/count.js');

describe('count', function () {
  it('count::build() with simple query', function() {
    var count = new Count();
    var query = count.build('table', {"count": 'id'}, {});
    query = query.toParam();

    query.text.should.be.equal("SELECT count('id') FROM table");
    query.values.should.be.empty;
  });

  it('count::build() with complex query', function () {
    var count = new Count();
    var query = count.build('table', {"count": 'id'}, {"somefield": '123'});
    query = query.toParam();

    query.text.should.be.equal("SELECT count('id') FROM table WHERE (somefield = $1)");
    query.values.should.be.deep.equal(['123']);
  });


  it('count::build() without count key', function () {
    var count = new Count();

    count.build.bind(count, 'table', {}, {}).should.throw("Need to provide a field to base the count on");
  });
});
