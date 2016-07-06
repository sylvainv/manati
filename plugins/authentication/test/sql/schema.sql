CREATE EXTENSION IF NOT EXISTS pgtap;

BEGIN;

SELECT plan(2);

SELECT has_table('manati_auth', 'users', 'manati_auth.users table exists');
SELECT has_table('manati_auth', 'permissions', 'manati_auth.users table exists');

ROLLBACK;