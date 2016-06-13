BEGIN;

--- authorize
CREATE OR REPLACE FUNCTION manati_auth.authorize_token(_token text) RETURNS text AS
$$
DECLARE _role text;
BEGIN
  SELECT u.role INTO _role FROM manati_auth.tokens t JOIN manati_auth.users u ON u.id = t.user_id WHERE t.token = _token;

  IF NOT FOUND THEN
    raise invalid_authorization_specification using message = 'Token does not exist';
  END IF;

  return _role;
END;
$$ language 'plpgsql' SECURITY DEFINER;

--- authorize
CREATE OR REPLACE FUNCTION manati_auth.authorize(_token text) RETURNS void AS
$$
DECLARE _role text;
BEGIN
  _role := manati_auth.authorize_token(_token);

  -- Expire old tokens
  EXECUTE 'SET SESSION ROLE ' || _role;
END;
$$ language 'plpgsql' SECURITY INVOKER;

COMMIT;