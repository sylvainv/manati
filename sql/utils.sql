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
DO
$body$
BEGIN
   IF NOT EXISTS (SELECT * FROM pg_catalog.pg_roles WHERE rolname = 'manati_admin') THEN
     CREATE ROLE manati_admin CREATEROLE BYPASSRLS NOREPLICATION NOSUPERUSER LOGIN;
   ELSE
     ALTER ROLE manati_admin CREATEROLE BYPASSRLS LOGIN;
   END IF;
END
$body$;

DO
$body$
BEGIN
   IF NOT EXISTS (SELECT * FROM pg_catalog.pg_roles WHERE rolname = 'manati_user') THEN
     CREATE ROLE manati_user LOGIN NOCREATEDB NOCREATEROLE NOBYPASSRLS NOSUPERUSER NOINHERIT;
   ELSE
     ALTER ROLE manati_user LOGIN NOCREATEDB NOCREATEROLE NOBYPASSRLS NOSUPERUSER NOINHERIT;
   END IF;
END
$body$;

CREATE SCHEMA IF NOT EXISTS manati_utils AUTHORIZATION manati_admin;

SET ROLE manati_admin;

-- Timestamps creation trigger
CREATE OR REPLACE FUNCTION manati_utils.set_timestamps() RETURNS trigger AS $$
BEGIN
    NEW.created_at := current_timestamp;
    NEW.updated_at := NEW.created_at;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Timestamps update trigger
CREATE OR REPLACE FUNCTION manati_utils.update_timestamps() RETURNS trigger AS $$
BEGIN
    -- Prevent update from erasing the created_at
    NEW.created_at := OLD.created_at;
    NEW.updated_at := current_timestamp;

    return NEW;
END;
$$ LANGUAGE plpgsql;

-- Initializes timestamp columns on a table
-- * table_name text the name of the table, can be identified with a schema, otherwise will use search_path to identify the table
CREATE OR REPLACE FUNCTION manati_utils.init_timestamps(table_name text) RETURNS void AS $$
BEGIN
  BEGIN
    EXECUTE 'ALTER TABLE ' || table_name || ' ADD COLUMN created_at TIMESTAMP WITH TIME ZONE';
    EXCEPTION
      WHEN duplicate_column THEN
        NULL;
  END;

  BEGIN
    EXECUTE 'ALTER TABLE ' || table_name || ' ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE';
    EXCEPTION
      WHEN duplicate_column THEN
        NULL;
  END;

  EXECUTE 'DROP TRIGGER if exists set_timestamps on ' || table_name;
  EXECUTE 'CREATE TRIGGER set_timestamps BEFORE INSERT on ' || table_name || ' FOR EACH ROW EXECUTE PROCEDURE manati_utils.set_timestamps()';

  EXECUTE 'DROP TRIGGER if exists update_timestamps on ' || table_name;
  EXECUTE 'CREATE TRIGGER update_timestamps BEFORE UPDATE on ' ||  table_name || ' FOR EACH ROW EXECUTE PROCEDURE manati_utils.update_timestamps()';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SET ROLE none;

COMMIT;