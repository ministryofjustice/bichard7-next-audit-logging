# General Event Handler

Designed as a replacement for the current queue listener in the Bichard system and PostgreSQL database storing the General Event Log items. This component of the Audit Logging solution comprises of an AWS Lambda Function that is triggered by event messages sent to the Bichard ActiveMQ `GENERAL_EVENT_LOG` queue. It transforms those messages into the Audit Log Event format, and passes through to the Audit Log API to attach them to the tracked Audit Log record.

## Development

```shell
# Install dependencies
$ npm i

# Build for development
$ npm run build:dev

# Run all tests (unit, integration and end to end)
$ npm test

# Build for production and deploy into the local infrastructure for use locally with other components
$ npm start
```

## Project Dependencies

The project also depends on the following Audit Logging projects:

1. `shared`
2. `audit-log-api`
