--/**
-- * Manati PostgreSQL REST API
-- * Copyright (C) 2016 Sylvain Verly
-- *
-- * This program is free software: you can redistribute it and/or modify
-- * it under the terms of the GNU Affero General Public License as
-- * published by the Free Software Foundation, either version 3 of the
-- * License, or any later version.
-- *
-- * This program is distributed in the hope that it will be useful,
-- * but WITHOUT ANY WARRANTY; without even the implied warranty of
-- * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
-- * GNU Affero General Public License for more details.
--
-- * You should have received a copy of the GNU Affero General Public License
-- * along with this program.  If not, see <http://www.gnu.org/licenses/>.
-- */
BEGIN;

CREATE EXTENSION pgcrypto;

CREATE TYPE mood AS ENUM ('sad', 'ok', 'happy');

CREATE TABLE uuid_data (
  -- uuids
  uuid uuid DEFAULT gen_random_uuid()
);

CREATE TABLE number_data (
  -- numbers
  smallint_real SMALLINT,
  int_number INTEGER,
  bigint_number BIGINT,
  decimal_number DECIMAL,
  numeric_number NUMERIC,
  real_number REAL,
  double_number DOUBLE PRECISION,
  serial_number SERIAL
);


CREATE TABLE string_data (
  -- characters
  char_short CHAR(1),
  char_long CHAR(10),
  string_short VARCHAR(1),
  string_long VARCHAR(15000),
  string VARCHAR,
  long_text TEXT
);

CREATE TABLE time_data (
  -- dates
  timestamp_data TIMESTAMP,
  timestampz_data TIMESTAMP WITH TIME ZONE,
  date_data DATE,
  time_data TIME,
  timez_data TIME WITH TIME ZONE,
  interval_data INTERVAL
);

CREATE TABLE misc_data (
  -- money
  money_number MONEY,

  -- boolean
  bool BOOLEAN,

  -- enum
  mood_data mood,

  -- bytes
  byte_data BYTEA,

  -- bit
  bit_data BIT(3)
);

CREATE TABLE ip_data (
  -- ips
  ip_data cidr,
  host_data inet,
  macaddr_data macaddr
);

CREATE TABLE json_data (
  -- json
  json_data JSON,
  jsonb_data JSONB
);

CREATE TABLE range_data (
  -- range
  int4range_data int4range,
  int8range_data int8range,
  numrange_data numrange,
  tsrange_data tsrange,
  tstzrange_data tstzrange,
  daterange daterange
);

COMMIT;