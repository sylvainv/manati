-- ===========================================================================================
-- FUNCTIONS
-- ===========================================================================================

-- CURRENT_MANATI_USER
-- +++++++++++++++++++++++++++++++++++
-- Set current manati user
-- +++++++++++++++++++++++++++++++++++
CREATE OR REPLACE FUNCTION manati_auth.current_manati_user(id uuid) RETURNS uuid as $$
BEGIN
  return set_config('manati.current_user', id::text, false);
END;
$$ LANGUAGE plpgsql;

-- +++++++++++++++++++++++++++++++++++
-- Get current manati user
-- +++++++++++++++++++++++++++++++++++
CREATE OR REPLACE FUNCTION manati_auth.current_manati_user() RETURNS uuid as $$
BEGIN
  BEGIN
    return current_setting('manati.current_user');
  EXCEPTION WHEN OTHERS THEN
    return null;
  END;
END;
$$ LANGUAGE plpgsql;

-- +++++++++++++++++++++++++++++++++++
-- Check permissions for user
-- +++++++++++++++++++++++++++++++++++
CREATE OR REPLACE FUNCTION manati_auth.check_permission_on_table(_id uuid, _table_name text) RETURNS int as $$
DECLARE _mask text;
BEGIN
  SELECT mask INTO _mask FROM manati_auth.permissions p WHERE table_name = _table_name AND user_id = _id;

  IF NOT FOUND THEN
    return 0::int;
  END IF;

  return _mask;
END;
$$ language plpgsql;

-- +++++++++++++++++++++++++++++++++++
-- Check if user has permission on table
-- +++++++++++++++++++++++++++++++++++
CREATE OR REPLACE FUNCTION manati_auth.has_permission_on_table(_id uuid, _table_name text, _mask int) RETURNS boolean as $$
BEGIN
  return (manati_auth.check_permission_on_table(_id, _table_name) & _mask) = _mask;
END;
$$ language plpgsql;

-- +++++++++++++++++++++++++++++++++++
-- Check if current user has permission on table
-- +++++++++++++++++++++++++++++++++++
CREATE OR REPLACE FUNCTION manati_auth.current_manati_user_has_permission_on_table(_table_name text, _mask int) RETURNS boolean as $$
BEGIN
  return manati_auth.has_permission_on_table(manati_auth.current_manati_user(), _table_name, _mask);
END;
$$ language plpgsql;

-- +++++++++++++++++++++++++++++++++++
-- Build a mask from a string with the character s for select, i for insert, u for update and d for delete
-- +++++++++++++++++++++++++++++++++++
CREATE OR REPLACE FUNCTION manati_auth.build_mask(_permissions text) RETURNS int as $$
DECLARE _mask int;
BEGIN
  _mask = 0;
  -- select 0001
  IF (strpos(_permissions, 's') != 0) THEN
    _mask = _mask | 1;
  END IF;

  -- insert 0010
  IF (strpos(_permissions, 'i') != 0) THEN
    _mask = _mask | 2;
  END IF;

  -- insert 0100
  IF (strpos(_permissions, 'u') != 0) THEN
    _mask = _mask | 4;
  END IF;

  -- delete 1000
  IF (strpos(_permissions, 'd') != 0) THEN
    _mask = _mask | 8;
  END IF;

  return _mask;
END;
$$ LANGUAGE plpgsql;

-- +++++++++++++++++++++++++++++++++++
-- Grant some permission on a table for a specific user, using int mask
-- +++++++++++++++++++++++++++++++++++
CREATE OR REPLACE FUNCTION manati_auth.grant_mask(_user_id uuid, _table_name text, _mask int) RETURNS void as $$
BEGIN
  INSERT INTO manati_auth.permissions AS p (table_name, user_id, mask)
    VALUES (_table_name::regclass, _user_id, _mask)
    ON CONFLICT ON CONSTRAINT permissions_pkey
    DO UPDATE SET mask = p.mask | _mask;
END;
$$ LANGUAGE plpgsql;

-- +++++++++++++++++++++++++++++++++++
-- Grant some permission on a table for a specific user using text permission
-- +++++++++++++++++++++++++++++++++++
CREATE OR REPLACE FUNCTION manati_auth.grant_permission(_user_id uuid, _table_name text, _permissions text) RETURNS void as $$
BEGIN
  PERFORM manati_auth.grant_mask(_user_id, _table_name, manati_auth.build_mask(_permissions));
END;
$$ LANGUAGE plpgsql;

-- +++++++++++++++++++++++++++++++++++
-- Revoke permission on a table for a specific user using int mask
-- +++++++++++++++++++++++++++++++++++
CREATE OR REPLACE FUNCTION manati_auth.revoke_mask(_user_id uuid, _table_name text, _mask int) RETURNS void as $$
BEGIN
  UPDATE manati_auth.permissions p SET mask = p.mask # _mask WHERE table_name = _table_name AND user_id = _user_id;
END;
$$ LANGUAGE plpgsql;

-- +++++++++++++++++++++++++++++++++++
-- Revoke permission on a table for a specific user using int mask
-- +++++++++++++++++++++++++++++++++++
CREATE OR REPLACE FUNCTION manati_auth.revoke_permission(_user_id uuid, _table_name text, _permissions text) RETURNS void as $$
BEGIN
  PERFORM manati_auth.revoke_mask(_user_id, _table_name, manati_auth.build_mask(_permissions));
END;
$$ LANGUAGE plpgsql;

