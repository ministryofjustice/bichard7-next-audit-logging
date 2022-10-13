CREATE SCHEMA br7own;
  GRANT ALL ON SCHEMA br7own TO bichard;

  CREATE TABLE br7own.archive_log
  (
      log_id          SERIAL PRIMARY KEY,
      archived_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      archived_by     TEXT,
      audit_logged_at TIMESTAMP
  );

  CREATE TABLE br7own.error_list
  (
      error_id                SERIAL PRIMARY KEY,
      message_id              VARCHAR(70)   NOT NULL
  );

  CREATE TABLE br7own.archive_error_list
  (
      error_id                SERIAL PRIMARY KEY,
      message_id              VARCHAR(70)   NOT NULL,
      archive_log_id          INTEGER REFERENCES br7own.archive_log (log_id) ON DELETE CASCADE,
      audit_logged_at         TIMESTAMP DEFAULT NULL,
      audit_log_attempts      INTEGER NOT NULL DEFAULT 0
  );
