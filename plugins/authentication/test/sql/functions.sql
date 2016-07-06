CREATE EXTENSION IF NOT EXISTS pgtap;

BEGIN;

SELECT * FROM no_plan();

-- TEST function set/get current_manati_user exists
SELECT has_function('manati_auth', 'current_manati_user', ARRAY['uuid'], 'Has function current_manati_user');
SELECT has_function('manati_auth', 'current_manati_user', 'Has function current_manati_user');

-- TEST results of current_manati_user
SELECT manati_auth.current_manati_user('4c7b0111-eead-4068-ba4f-b1f7edc4b82e'::uuid);
SELECT results_eq('SELECT manati_auth.current_manati_user()', ARRAY['4c7b0111-eead-4068-ba4f-b1f7edc4b82e'::uuid]);

-- TEST permissions
-- create table to test permissions
CREATE TABLE stuff (id uuid primary key, author_id uuid references manati_auth.users(id));

-- insert data
INSERT INTO manati_auth.users (id, password) VALUES ('e9cc8d83-c5da-4950-98bd-c3ddd27e4192', '123');
SELECT manati_auth.current_manati_user('e9cc8d83-c5da-4950-98bd-c3ddd27e4192'::uuid);

SELECT has_function('manati_auth', 'grant_mask', ARRAY['uuid', 'text', 'integer'], 'Has function grant_mask(uuid, text, int)');
SELECT has_function('manati_auth', 'revoke_mask', ARRAY['uuid', 'text', 'integer'], 'Has function revoke_mask(uuid, text, int)');

SELECT has_function('manati_auth', 'grant_permission', ARRAY['uuid', 'text', 'text'], 'Has function grant_permission(uuid, text, text)');
SELECT has_function('manati_auth', 'revoke_permission', ARRAY['uuid', 'text', 'text'], 'Has function revoke_permission(uuid, text, text)');

SELECT manati_auth.grant_permission('e9cc8d83-c5da-4950-98bd-c3ddd27e4192'::uuid, 'stuff', 'si');

SELECT is(manati_auth.check_permission_on_table('e9cc8d83-c5da-4950-98bd-c3ddd27e4192'::uuid, 'stuff'), 3, 'Have read and insert permission');

SELECT is(manati_auth.has_permission_on_table('e9cc8d83-c5da-4950-98bd-c3ddd27e4192'::uuid, 'stuff',  1), true, 'Have select permission');
SELECT is(manati_auth.has_permission_on_table('e9cc8d83-c5da-4950-98bd-c3ddd27e4192'::uuid, 'stuff',  8), false, 'Have not delete permission');
SELECT is(manati_auth.has_permission_on_table('e9cc8d83-c5da-4950-98bd-c3ddd27e4192'::uuid, 'stuff', 2), true, 'Have not insert permission');

SELECT is(manati_auth.current_manati_user_has_permission_on_table('stuff', 1), true, 'Have select permission for current user');
SELECT is(manati_auth.current_manati_user_has_permission_on_table('stuff', 8), false, 'Have not delete permission for current user');
SELECT is(manati_auth.current_manati_user_has_permission_on_table('stuff', 2), true, 'Have not insert permission for current user');

SELECT mask::bit(4) FROM manati_auth.permissions;
SELECT manati_auth.revoke_mask('e9cc8d83-c5da-4950-98bd-c3ddd27e4192'::uuid, 'stuff', 1);
SELECT mask::bit(4) FROM manati_auth.permissions;
SELECT is(manati_auth.current_manati_user_has_permission_on_table('stuff', 1), false, 'Have not read permission anymore');


ROLLBACK;