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

CREATE TYPE mood AS ENUM ('sad', 'ok', 'happy');

CREATE TABLE uuid_data (
  -- uuids
  uuid uuid
);
INSERT INTO uuid_data (uuid) VALUES ('199F5EFB-2DF6-42CF-90D7-61D90212C74A'), ('513BB1CA-EEA6-4B51-A79A-F3FE02393C35'), ('C4E687AF-2ACE-4721-8B77-4DC9F81096F0');

CREATE TABLE number_data (
  -- numbers
  smallint_number SMALLINT,
  int_number INTEGER,
  bigint_number BIGINT,
  decimal_number DECIMAL,
  numeric_number NUMERIC,
  real_number REAL,
  double_number DOUBLE PRECISION
);
INSERT INTO number_data (smallint_number, int_number, bigint_number, decimal_number, numeric_number, real_number, double_number)
VALUES (-32768, -2147483648, -9223372036854775808, 1.131072, 2.131072, 1.126728, 1.126728126728982),
(32767, 2147483647, 9223372036854775807, 1.2, 1.3, 0.1, 0.000000000000001);

CREATE TABLE string_data (
  -- characters
  char_short CHAR(1),
  char_long CHAR(5),
  string_short VARCHAR(1),
  string_long VARCHAR(5),
  string VARCHAR,
  long_text TEXT
);
INSERT INTO string_data (char_short, char_long, string_short, string_long, string, long_text)
VALUES ('a', 'aujki', 'b', 'idkao', 'Some unlimited sentence, bla bla bla', 'Ze big big textlorem ipsmu');


CREATE TABLE time_data (
  -- dates
  timestampz_data TIMESTAMP WITH TIME ZONE,
  date_data DATE,
  time_data TIME,
  timez_data TIME WITH TIME ZONE,
  interval_data INTERVAL
);
INSERT INTO time_data (timestampz_data, date_data, time_data, timez_data, interval_data)
VALUES
('January 8 04:05:06 1999 PST', 'January 8, 1999', '04:05:06', '04:05:06 PST', '1 year 2 months 3 days 4 hours 5 minutes 6 seconds'),
('January 8 04:05:06 1999 PST', 'January 8, 1999', '04:05:06', '04:05:06 PST', 'P1Y2M3DT4H5M6S');

CREATE TABLE misc_data (
  -- money
  money_data MONEY,

  -- boolean
  bool_data BOOLEAN,

  -- enum
  mood_data mood,

  -- bit
  bit_data BIT(3)
);
INSERT INTO misc_data (money_data, bool_data, mood_data, bit_data)
VALUES ('52093.89', true, 'ok', '101');

CREATE TABLE ip_data (
  -- ips
  ip_data cidr,
  host_data inet,
  macaddr_data macaddr
);
INSERT INTO ip_data (ip_data, host_data, macaddr_data)
VALUES ('192.168.100.128/25', '192.168.12.1', '08:00:2b:01:02:03');

CREATE TABLE json_data (
  -- json
  json_data JSON,
  jsonb_data JSONB
);
INSERT INTO json_data (json_data, jsonb_data)
VALUES ('{"string":"some-data", "number":1, "null-data": null, "boolean": true}', '{"string":"some-data", "number":1.2, "null-data": null, "boolean": true}');

CREATE TABLE range_data (
  -- range
  int4range_data int4range,
  int8range_data int8range,
  numrange_data numrange,
  tsrange_data tsrange,
  tstzrange_data tstzrange,
  daterange_data daterange
);
INSERT INTO range_data (int4range_data, int8range_data, numrange_data, tsrange_data, tstzrange_data, daterange_data)
VALUES ('[1,2)', '[128, 890]', '(11.1, 22.2)', '[2010-01-01 14:30, 2010-01-01 15:30)', '[2010-01-01 14:30, 2010-01-01 15:30)', '[January 8 1999, January 8 2000]');

COMMIT;