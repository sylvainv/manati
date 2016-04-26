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

var Delete = manati_test_require('lib/delete.js');

describe('delete', function () {
  it('delete::build() with simple query', function() {
    var delet = new Delete();
    var query = delet.build('table', {}, {"number": '1', "string": "string", "float": '1.22'});
    query = query.toParam();

    query.text.should.be.equal("DELETE FROM table WHERE (number = $1 AND string = $2 AND float = $3) RETURNING *");
    query.values.should.be.deep.equal(['1','string', '1.22']);
  });

  it('delete::build() mass deleting not allowed', function () {
    var delet = new Delete();
    delet.build.bind(delet, 'table', {}, {})
      .should.throw('You need to pass query parameters to filter out the data, deleting the whole table content is' +
      ' not allowed');
  });
});
