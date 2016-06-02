# Manati

REST API for PostgreSQL. Forget ORM!

[![Build Status](https://travis-ci.org/sylvainv/pg-manati.svg?branch=master)](https://travis-ci.org/sylvainv/pg-manati)

## Warning

This is still in heavy development and some functionality might change. Be careful when you do an update.

## Usage

```bash
# Add sql utils function, and a user you can use to connect to the database
psql < sql/utils.sql

# Add sql authentication tables and schema (used by the authentication plugin)
psql < sql/authentication.sql
```

```javascript
var manati = require('pg-manati');
var app = manati(
  process.env.DATABASE_URL // your database connection string
);

// Manati uses KoaJS, if you want to extend it to your needs you can use (see http://koajs.com/ for more info)
app.koa.use(function* (next) {
  // add whatever code you want, will be executed first
  yield next;
});

// add authentication routes to the list
app.addPlugin('authentication'));

// add authentication middleware for all routes in the data router (route starting with /data)
app.addPlugin('authorization'), 'data');

// this will execute the setup script on every start up, you can choose
app.setup().then(() => {
  app.init({
    logLevel: 'fatal'|'error'|'warn'|'info'|'debug'| // the log level used by the bunyan logger (default 'info'), see https://github.com/trentm/node-bunyan for more info
    logRequest: true|false // whether to log request, using INFO logging level
    logStreams: [] // an array of log streams, see https://github.com/trentm/node-bunyan for more information
  });
  app.start(3000);
});


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
