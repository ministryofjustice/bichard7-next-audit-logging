# Archive user logs

A lambda that is pushed logs which match a filter from cloudwatch logs. The filter matches user logs from the [Record Event](../record-event/README.md) lambda and from User Service. The logs are pushed to this lambda as an event, parsed and written to an archive (s3 bucket). The archive moves the logs to cold storage after 125 days of no access.

You can find the logs in the s3 bucket `$ENV_PREFIX-archive-user-logs under the path` with the path `$logGroupName/$Date}/$logStream/$timestamp}`
