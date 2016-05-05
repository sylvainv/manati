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

-- Create manati_admin role
SET ROLE manati_admin;

-- Mark table for watch creation trigger
CREATE OR REPLACE FUNCTION manati_utils.notify_changes(target text) RETURNS void AS $$
BEGIN
  EXECUTE 'DROP TRIGGER if exists notify_on_change on ' || target;
  EXECUTE 'CREATE TRIGGER notify_on_change AFTER UPDATE OR DELETE OR INSERT on ' || target || ' FOR EACH ROW EXECUTE PROCEDURE manati_utils.notify_on_change()';
END;
$$ LANGUAGE plpgsql;

-- Timestamps update trigger
CREATE OR REPLACE FUNCTION manati_utils.notify_on_change() RETURNS trigger AS $$
DECLARE _data json;
BEGIN
  IF (TG_OP = 'DELETE') THEN
      _data = row_to_json(OLD);
  ELSE
      _data = row_to_json(NEW);
  END IF;

  PERFORM pg_notify(
    format('%s__%s__%s', lower(TG_OP), TG_TABLE_SCHEMA, TG_TABLE_NAME),
    _data::text
  );

  RETURN NULL; -- result is ignored since this is an AFTER trigger
END;
$$ LANGUAGE plpgsql;

-- build the channel name to listen to
CREATE OR REPLACE FUNCTION manati_utils._build_channel(target text, type text) RETURNS text AS $$
DECLARE _schema_name text;
DECLARE _target text;
DECLARE _channel text;
DECLARE _has_privilege boolean;
BEGIN
  -- regclass casting will change a schema qualified name into the table name, if it doesn't exissts it will throw an error
  _target := target::regclass::text;
  -- check if the relation exist
  -- if the table is not found the ::regclass cast will raise a table not found error
  SELECT schemaname INTO _schema_name FROM pg_tables WHERE schemaname = ANY (CURRENT_SCHEMAS(false)) AND tablename = _target;

  -- check table privilege
  SELECT has_table_privilege(target, 'select') INTO _has_privilege;
  IF _has_privilege THEN
    RAISE prohibited_sql_statement_attempted USING message = 'You do not have access to read this table';
  END IF;

  -- format channel name
  _channel := format('%s__%s__%s', lower(type), _schema_name, _target);

  return _channel;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- listen for changes on the table
CREATE OR REPLACE FUNCTION manati_utils.listen(target text, type text) RETURNS text AS $$
DECLARE _schema_name text;
DECLARE _target text;
DECLARE _channel text;
DECLARE _has_privilege boolean;
BEGIN
  -- format channel name
  SELECT manati_utils._build_channel(target, type) INTO _channel;
  EXECUTE format('LISTEN %s', _channel);
  return _channel;
END;
$$ LANGUAGE plpgsql;

-- stop listening for changes on the table
CREATE OR REPLACE FUNCTION manati_utils.unlisten(target text, type text) RETURNS text AS $$
DECLARE _channel text;
BEGIN
  -- format channel name
  SELECT manati_utils._build_channel(target, type) INTO _channel;
  EXECUTE format('UNLISTEN  %s', _channel);
  return _channel;
END;
$$ LANGUAGE plpgsql;


SET ROLE none;

COMMIT;
