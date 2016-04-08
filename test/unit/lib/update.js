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

var Update = manati_test_require('lib/update.js');

describe('update', function () {
  it('update::build() with simple query', function() {
    var update = new Update();
    var query = update.build('table', {"number": '1', "string": "string", "float": '1.22'}, {"float": "gt::1.22"});
    query = query.toParam();

    query.text.should.be.equal("UPDATE table SET number = $1, string = $2, float = $3 WHERE (float > $4) RETURNING *");
    query.values.should.be.deep.equal(['1','string', '1.22', '1.22']);
  });

  it('update::build() with simple query', function () {
    var update = new Update();
    update.build.bind(update, 'table', [], {"float": "gt::1.22"}).should.throw('Cannot handle array update');
  });

  it('update::build() mass updating not allowed', function () {
    var update = new Update();
    update.build.bind(update, 'table', {"number": '1', "string": "string", "float": '1.22'}, {})
      .should.throw('You need to pass query parameters to filter out the data, mass updating is not allowed');
  });

  it('update::build() non ascii column names will fail', function () {
    var update = new Update();
    update.build.bind(update, 'table', {'*(&': 'value'}).should.throw('Malformed column name: *(&');
  });
});
