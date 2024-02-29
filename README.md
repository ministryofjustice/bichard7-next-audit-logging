# Bichard7 Next: Audit Logging

A collection of components that are hosted within AWS that form parts of the new Bichard7 architecture.

![Bichard7 Audit Logging](/docs/infrastructure.png?raw=true "Infrastructure")

Other diagrams:

- [Incoming message handler](/src/incoming-message-handler)
- [Event handler](/src/event-handler)

## Components

This repository contains multiple distinct components that together form the audit logging service within Bichard7. Each component is wrapped up in a separate node package.

- [**Audit Log API** (`audit-log-api`)](src/audit-log-api/) - API exposing Audit Log records and attached events
- [**Incoming Message Handler** (`incoming-message-handler`)](src/incoming-message-handler/) - AWS Step Functions and Lambdas for intercepting and processing messages coming into the Bichard system
- [**Event Handler** (`src/event-handler`)](src/event-handler/) - A component that handles messages received from queues and translates them into Audit Log events.

Lambdas:

- [**Message Receiver** (`src/message-receiver`)](src/message-receiver/) - Receives messages from subscribed queues, embellishes with the source and format, and forwards onto the [Event Handler](event-handler/) Step Function.

- [**Transfer Messages** (`src/transfer-messages`)](src/transfer-messages) - Transfers incoming messages from the external incoming messages S3 bucket to the internal one.

- [**Archive User Logs** (`src/archive-user-logs`)](src/archive-user-logs/) - Subscribe to logs output by the User Service and the Store Event Lambda which match a subscription filter and then store them in s3 cold storage.

- [**Add Archival Events** (`src/add-archival-events`)](src/add-archival-events) - Records in the audit log when error records have been archived in the postgres database.

Code shared between multiple components:

- [**Shared code** (`shared`)](src/shared/) - Library of code that is common to multiple components.
- [**Shared types** (`shared-types`)](src/shared-types/) - Library of typescript type/interface definitions that are used in multiple components.
- [**Shared testing** (`shared-testing`)](src/shared-testing/) - Library of shared code that is used for testing multiple components.

## Quick start

The majority of code in this repository is written in Typescript. In order to ensure you're using the right version of Node and npm, you should:

1. Install [`nvm`](https://github.com/nvm-sh/nvm)
2. In the root of this repository, run:

   ```shell
   nvm install
   nvm use
   ```

This will use the version specified in the [`.nvmrc`](.nvmrc) file.

We use `pg-native` library to access PostgreSQL. You need to install the following before installing node packages:

```shell
brew install postgresql
brew install libpq
```

You can then use the npm commands to get started:

```shell
# Running the services for local development

# Spin up mq and postgres
npm run db:mq

# Install dynamo and start the API
npm run start api

# If you want to destory mq and postgres containers
npm run destory

```

Where applicable, each component has tests that are run by Jest. To run these, simply run `npm test` from within the relevant project folder. Projects may also have different test scripts that you can run with the following commands:

- Run all tests - `npm test`
- Unit tests - `npm run test:unit`
- Integration tests - `npm run test:integration`
- Component-level end-to-end tests - `npm run test:e2e`
- UI tests - `npm run test:ui`
- Continuous Integration test run (run by the CI pipeline) - `npm run test:ci`

All of these approaches will execute tests in a watch mode, which will allow you to make changes to the underlying tests or codebase and then save the files to automatically trigger another test run.

> Note: Before running integration or end-to-end tests, you need to make sure you have rebuilt any changes using `npm run build` in the respective project folder.

## A note on running the docker container locally

Nginx is doing ssl termination and requires a certificate and key pair to be in the `/certs` path.
In order to run this locally you can generate a self-signed certificate and key using [this method](https://linuxize.com/post/creating-a-self-signed-ssl-certificate/) and then mount
this as a volume in your container

ie `docker run --rm -v /path/to/your/certificates:/certs -p 80:80 -p 443:443 -e API_URL=xxx audit-logging-portal:latest`

## Summarising an audit log record

Sometimes if we receive requests for information about how a message was handled it's useful to be able to export an audit log record in a format that can be shared. You can use the `summarise-record.ts` script for this:

```
aws-vault exec qsolution-production -- npx ts-node -T ./scripts/utils/summarise-record.ts <message ID>
```
