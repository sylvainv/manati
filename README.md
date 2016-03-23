# Manati

REST API for PostgreSQL. Forget ORM!

## Usage

```javascript
var manati = require('manati');
var app = manati(process.env.DATABASE_URL || 'postgres://user@localhost/database', 'www.example.com');

// Manati uses KoaJS, if you want to extend it to your needs you can use (see http://koajs.com/ for more info)
app.koa.use(function* (next) {
  // add whatever code you want, will be executed first
});

app.init();
app.start(3000);
```