# Record Error Archival

A lamdba that records in the audit log when error records have been archived in the postgres database.

Error records are archived when they are moved from the `error_list` table into the `archive_error_list` table by one of the postgres functions that runs regularly