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


CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS manati_auth;

-- Create a basic role to be used for internal system authorization, to make sure those roles cannot perform actions not required
CREATE OR REPLACE FUNCTION manati_auth.create_basic_role(_role_name text) returns text as $$
BEGIN
   _role_name = 'manati_role_' || _role_name;
   IF NOT EXISTS (SELECT * FROM pg_catalog.pg_roles WHERE rolname = _role_name) THEN
       EXECUTE 'CREATE ROLE "' || _role_name || '" NOLOGIN NOCREATEDB NOCREATEROLE NOBYPASSRLS NOREPLICATION NOSUPERUSER INHERIT IN ROLE manati_user';
   END IF;

   return _role_name;
END
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove role
CREATE OR REPLACE FUNCTION manati_auth.remove_basic_role(_role_name text) returns text as $$
BEGIN
   EXECUTE 'DROP ROLE IF EXISTS "' || _role_name;
   return _role_name;
END
$$ LANGUAGE plpgsql SECURITY DEFINER;

-------------------
-- FUNCTIONS
-------------------

-- Encode password
CREATE OR REPLACE FUNCTION manati_auth.encode_password() RETURNS trigger AS $$
BEGIN
  NEW.password = crypt(NEW.password, gen_salt('md5'));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set role
CREATE OR REPLACE FUNCTION manati_auth.set_role() RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    PERFORM manati_auth.remove_basic_role(OLD.role);
  END IF;

  NEW.role = manati_auth.create_basic_role(NEW.username);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate token
CREATE OR REPLACE FUNCTION manati_auth.generate_token() RETURNS text AS $$
BEGIN
  return encode(digest(gen_random_bytes(256), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- set token
CREATE OR REPLACE FUNCTION manati_auth.set_token() RETURNS trigger AS $$
BEGIN
  NEW.token = manati_auth.generate_token();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-------------------
-- TABLES
-------------------
-- Create users table
CREATE TABLE IF NOT EXISTS manati_auth.users(
  username VARCHAR(100) NOT NULL PRIMARY KEY,
  password VARCHAR(34) ,
  role REGROLE NOT NULL,

  CONSTRAINT valid_username CHECK (username ~ E'[a-zA-Z0-9_.-]{3,100}')
);
SELECT manati_utils.init_timestamps('manati_auth.users');

-- password set trigger
DROP TRIGGER if exists set_password on manati_auth.users;
CREATE TRIGGER set_password BEFORE INSERT OR UPDATE OF password ON manati_auth.users FOR EACH ROW EXECUTE PROCEDURE manati_auth.encode_password();

-- password set trigger
DROP TRIGGER if exists set_role on manati_auth.users;
CREATE TRIGGER set_role BEFORE INSERT OR UPDATE OF role ON manati_auth.users FOR EACH ROW EXECUTE PROCEDURE manati_auth.set_role();

-- Tokens table
CREATE TABLE IF NOT EXISTS manati_auth.tokens(
  token VARCHAR(64) PRIMARY KEY,
  username VARCHAR(100) UNIQUE REFERENCES manati_auth.users(username  ) ON DELETE CASCADE,
  -- Make sure the login is valid
  CONSTRAINT valid_token CHECK (token ~ E'[a-f0-9]{64}')
);
SELECT manati_utils.init_timestamps('manati_auth.tokens');

--- create token
CREATE OR REPLACE FUNCTION manati_auth.create_token(_username text, _password text) RETURNS text AS
$$
DECLARE _token text;
BEGIN
  PERFORM u.username FROM manati_auth.users u WHERE u.username = _username AND u.password = crypt(_password, u.password);

  IF NOT FOUND THEN
    raise invalid_password using message = 'Nobody found with this username/password';
  END IF;

  -- Expire old tokens
  DELETE FROM manati_auth.tokens WHERE created_at < NOW() - INTERVAL '2 days';
  INSERT INTO manati_auth.tokens (token, username) VALUES (manati_auth.generate_token(), _username) RETURNING token INTO _token;

  return _token;
END;
$$ language 'plpgsql' SECURITY DEFINER;

GRANT USAGE on SCHEMA manati_auth TO manati_user;
GRANT EXECUTE on ALL FUNCTIONS in SCHEMA manati_auth TO manati_user;

INSERT INTO manati_auth.users (username, password) VALUES ('admin', 'admin') ON CONFLICT DO NOTHING;

SET ROLE none;

