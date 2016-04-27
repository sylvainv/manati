# Manati

REST API for PostgreSQL. Forget ORM!

[![Build Status](https://travis-ci.org/sylvainv/pg-manati.svg?branch=master)](https://travis-ci.org/sylvainv/pg-manati)

## Usage

```javascript
var manati = require('pg-manati');
var app = manati(
  process.env.DATABASE_URL || 'postgres://user@localhost/database', // your database connection string
  'info' // the minumum log level that will be output
);

// Manati uses KoaJS, if you want to extend it to your needs you can use (see http://koajs.com/ for more info)
app.koa.use(function* (next) {
  // add whatever code you want, will be executed first
});

app.init();
app.start(3000);
```

[Check our wiki](https://github.com/sylvainv/pg-manati/wiki) for more information!

## Example

### Get some users data
```
GET /data/users?limit=2&name=like::J*
```
```json
[{"name": "John", "age": 22}, {"name": "Jessie", "age": 30}]
```

### Update some users data
```
PATCH /data/users?name=eq::Jessie
Content-Type application/json
{
  "age": 23
}
```
```json
[{"name": "John", "age": 22}, {"name": "Jessie", "age": 23}]
```

### Create some new data
```
POST /data/users
Content-Type application/json
{
  "name": "Joe",
  "age": 21
}
```
```json
[{"name": "Joe", "age": 21}]
```

### Delete some users data
```
GET /data/users?name=eq::John
```
```json
[{"name": "John", "age": 22}]
```
