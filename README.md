# ulisha-store-migration

Migrate ulisha-store-next to ulisha-store-laravel

`SUPABASE_DB_URL` connects directly to the PostgreSQL database, which is required for schema introspection because tools need access to PostgreSQL system catalogs like `information_schema` and `pg_catalog`. The `SUPABASE_ANON_KEY` only authenticates requests to Supabase’s API layer and does not provide low-level database metadata access.

## Usage

Schema Introspect:

```bash
npm run schema
```

Export Product Data:

```bash
npm run export
```

## Installation

Install dependencies:

```bash
npm install
```

Copy environment variables:

```bash
cp .env.example .env
```

Edit `.env` to set your database credentials and other configuration.

## License

This project is licensed under the MIT License.
