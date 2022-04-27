# Record Error Archival

A lamdba that records in the audit log when error records have been archived in the postgres database.

Error records are archived when they are moved from the `error_list` table into the `archive_error_list` table by one of the postgres functions that runs regularly, which operates on batches recorded in the `archive_log` table.

This lambda retreives the error records, creates audit log events on the audit log entry for the errors, then updates the database entries to reflect this. Individual entries in `archive_error_list` have the `audit_logged_at` column set when they have been successfully audit logged, and batches have the `archive_error_list` column set when every error in the batch has been audit logged.

There are some controls available as environment variables:

| Environment variable | Description |
|----------------------|-------------|
| API_URL              | The URL to the audit logging API |
| API_KEY              | An API key for the audit logging API |
| DB_HOST              | The host of the bichard7 database to use |
| DB_USER              | The user to authenticate to the bihcard7 database as |
| DB_PASSWORD          | The password to use to authenticate to the bichard7 database |
| DB_SSL               | Whether to use SSL when connecting to the bichard7 database. Defaults to false |
| DB_NAME              | The database name where the archived error tables reside |
| DB_SCHEMA            | The schema name which the archived error tables reside under |
| ARCHIVE_GROUP_LIMIT  | The number of archive log groups to audit log at a time |

## e2e Testing

In order to run the `e2e` tests, you firstly need to be running a `postgres` instance and the `audit log api`. This can be acomplised by running:

```bash
    make run-pg
    make run-api
```

from the top-level directory of this repository. If you have issues connecting to the `postgres` instance, ensure that the `postgres` container used by `bichard7-next` isn't running, as these will clash.

The `e2e` tests also depend on the lambda code in `.../src` being build. To do this, run `npm run build` from within this directory, or as part of `make build-all` from the top-level directory.
