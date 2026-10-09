# functions/

Reserved for server-side glue that must run somewhere — currently empty.

**Planned (Phase P6, `docs/11` §11.8):** Lemon Squeezy webhook that links a
purchase to a Firebase account. Until it exists, licence activation stays the
manual in-app flow (`license_manager`), which already ships and works.

Deliberately *not* home to any auth logic: authentication is
`gmail-merge/auth_client.py` + Google Firebase Authentication.
