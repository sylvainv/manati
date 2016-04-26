CREATE EXTENSION pgtap;

BEGIN;

SELECT has_role('manati_admin', 'Role manati_admin exist');
SELECT has_schema('manati_utils', 'Role manati_utils schema exist');

SELECT has_schema('manati_utils', 'Role manati_utils schema exist');

SELECT has_function('manati_utils', 'set_timestamps');

SELECT manati_utils.set_timestamps();

CREATE TABLE test_set_timestamps (
  data TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
CREATE TRIGGER test_set_timestamps BEFORE INSERT on test_set_timestamps FOR EACH ROW EXECUTE PROCEDURE manati_utils.set_timestamps();

INSERT INTO test_set_timestamps (data) VALUES ('BLA BLA');

ROLLBACK;