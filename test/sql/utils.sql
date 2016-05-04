CREATE EXTENSION pgtap;

BEGIN;

SET ROLE manati_admin;

SELECT * FROM no_plan();

SELECT has_role('manati_admin', 'Role manati_admin exist');
SELECT has_schema('manati_utils', 'Role manati_utils schema exist');

SELECT has_schema('manati_utils', 'Role manati_utils schema exist');

SELECT has_function('manati_utils', 'set_timestamps');

-- test set_timestamps trigger
CREATE TABLE test_set_timestamps (
  data TEXT
);
SELECT manati_utils.init_timestamps('test_set_timestamps');

-- check trigger name
SELECT triggers_are('test_set_timestamps', ARRAY['set_timestamps', 'update_timestamps'])


INSERT INTO test_set_timestamps (data) VALUES ('BLA BLA');

PREPARE test_timestamp AS SELECT * FROM test_set_timestamps LIMIT 1;
SELECT row_eq('test_timestamp', ROW('BLA BLA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)::test_set_timestamps );


SELECT * FROM finish();
ROLLBACK;