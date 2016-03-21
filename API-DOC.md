# API Reference

## `GET /data/:table` get row from a table

Retrieve data from a table

### Parameters

* Literally any column that is in the table, this can be queried using
`column=operator.value` (e.g. name=eq.Letsface). Possible operator are:

    * eq: equal
    * neq: non equal
    * gt: greater than
    * gte: greater or equal than
    * lt: less than
    * lte: less or equal than
    * like: like (specify a pattern using wildcard *)
    * ilike: case insensitive version of like

If you want to query a json field, for instance the column data is a json field. If you want to query given the
field name inside data, you can use the dot notation data.name=eq.TheName

* order If you want to specify the order on a column order=column.asc or order=column.desc
* limit If you want to limit the result

### Response

`HTTP/1.1 200 OK`
```json
 [
 {
  "id": "77534cd9-fdc4-4533-870b-d4918a253e17",
  "name": "Hugs",
  "data": {},
  "start_date": null,
  "end_date": null,
  "created_at": "2015-07-31T04:34:13.973Z",
  "updated_at": "2015-07-31T04:34:13.973Z"
 }
]
```

## `POST /data/:table` insert rows into a table

### Parameters

* Accepts json type data as input

### Example

```
HTTP/1.1 /data/company
Content-Type: application/json
```
```json
 {
   "name": "My company"
 }
```

### Response

`HTTP/1.1 200 OK`
```json
 [
 {
  "id": "16261dec-267d-439d-941d-5c75eec24225",
  "name": "Xidada",
  "data": {},
  "created_at": "2015-07-31T04:34:13.973Z",
  "updated_at": "2015-07-31T04:34:13.973Z"
 }
]
```

## `PUT /data/:table` Update data from a table

This will update ALL data related to the query you are making, so you must provide a "column"
parameter to filter down the data, otherwise the query will fail

### Parameters

* column Literally any column that is in the table, this can be queried using
column=operator.value (e.g. name=eq.Letsface). Possible operator are:

  * eq: equal
  * neq: non equal
  * gt: greater than
  * gte: greater or equal than
  * lt: less than
  * lte: less or equal than
  * like: like (specify a pattern using wildcard *)
  * ilike: case insensitive version of like

If you want to query a json field, for instance the column data is a json field. If you want to query given the
field name inside data, you can use the dot notation data.name=eq.TheName

### Example

 Will update all company whose owner id is 0b68ec96-ac3e-431f-8a0f-b9f3fc018deb with the same name, json data
 CANNOT be partially updated for now. That means the following won't update partially the JSON data with name, but will
 update the whole json field.

```json
 {
   "data": {"name": "Some name"}
 }
```

The following will update the field `name` correctly

```
HTTP/1.1 /data/company?owner_id=eq.3e3f84e9-f1dd-4659-a748-66bbfdbfeafe
Content-Type: application/json
```
```json
 {
   "name": "My company"
 }
```

## Errors

### Possible errors

* _500 Error:_ For unexpected errors, on prod the message shouldn't contain any useful information
* _400 Bad Request:_ If a required parameter is missing or malformed
* _404 Not Found:_ If the table does not exist
* _401 Unauthorized:_ If you are not authorized to see this content, need to get a token first

### Json errors

All errors returned are JSON.

`HTTP/1.1 400 Bad Request`
```json
{"error":"Need to pass a username"}
