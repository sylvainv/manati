CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS acl;

CREATE SCHEMA IF NOT EXISTS manati_auth;

-- ===========================================================================================
-- TABLES
-- ===========================================================================================
-- Create users table
CREATE TABLE IF NOT EXISTS manati_auth.users(
  id uuid PRIMARY KEY,
  password VARCHAR(34) NOT NULL
);
SELECT manati_utils.init_timestamps('manati_auth.users');

-- Create table permissions table
CREATE TABLE IF NOT EXISTS manati_auth.permissions(
  table_name text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES manati_auth.users(id),
  mask int NOT NULL
);
SELECT manati_utils.init_timestamps('manati_auth.permissions');
