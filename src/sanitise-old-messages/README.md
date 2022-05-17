# Add Archival Events

A lambda that sanitises (removes PII from) audit log messages older than the threshold configured (currently 3 months). Messages are eligible to be sanitised when they have been archived after being resolved and are older than the threshold. Messages are sanitised by calling the sanitise endpoint of the audit logging API.

## Running

Start the audit logging API with `make run-api` from the top level directory of this repo.

The tests can be run from this directory with `npm run test`.

If you make changes to the shared libraries (`shared`, `shared-types` or `shared-testing`), you will need to run `make shared` from the top level directory to use these changes.

## Configuration

This lambda uses several environment variables to connect to other services:

|Variable name|Description|
|-------------|-----------|
|SANITISE_AFTER_DAYS|The threshold after which to sanitise audit log messages, in days|
|CHECK_FREQUENCY_DAYS|How often to check if audit log messages are eligible to be sanitised, in days|
|MESSAGE_FETCH_BATCH_NUM|The number of audit log messages to check for sanitisation in one invocation|
|DB_HOST|The hostname where the postgres database is running|
|DB_PORT|The port to connect to the postgres database|
|DB_USER|The username to authenticate to the postgres database as|
|DB_PASSWORD|The password for the postgres database|
|DB_NAME|The name of the database in postgres|
|DB_SCHEMA|The schema where the tables reside in postgres|
|DB_SSL|Whether to use SSL when connecting to the postgres database. Set to `true` to enable|
|AWS_URL|The URL where dynamodb is accessible|
|AWS_REGION|The AWS region that dynamodb is running in|
|AUDIT_LOG_TABLE_NAME|The table name which contains audit log messages. Defaults to `auditLogTable`|
|DYNAMO_AWS_ACCESS_KEY_ID|The access key ID to use to authenticate to dynamodb|
|DYNAMO_AWS_SECRET_ACCESS_KEY|The secret access key to use to authenticate to dynamodb|
|API_URL|The URL where the audit logging API is accessible|
|API_KEY|The API key to use to authenticate with the audit logging API|

## Queueing

