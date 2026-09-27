# Local Docker secrets

Create two extensionless UTF-8 text files in this directory before starting the
Compose stack:

- `oracle_sys_password`
- `oracle_app_password`

Each file must contain only its password. These values are ignored by Git and
excluded from the web image build context. Do not commit them.
