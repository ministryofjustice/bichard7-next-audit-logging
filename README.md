# Bichard7 Next: Audit Logging

A collection of components that are hosted within AWS that form parts of the new Bichard7 architecture.

![Bichard7 Audit Logging](/docs/infrastructure.png?raw=true "Infrastructure")

Other diagrams:

- [Incoming message handler](/src/incoming-message-handler)
- [Event handler](/src/event-handler)

## Components

This repository contains multiple distinct components that together form the audit logging service within Bichard7. Each component is wrapped up in a separate node package.

* [**Audit Log API** (`audit-log-api`)](src/audit-log-api/) - API exposing Audit Log records and attached events
* [**Audit Log Portal** (`audit-log-portal`)](src/audit-log-portal/) - Web-based portal allowing access to view and explore all Audit Log records and their events
* [**Incoming Message Handler** (`incoming-message-handler`)](src/incoming-message-handler/) - AWS Step Functions and Lambdas for intercepting and processing messages coming into the Bichard system
* [**Event Handler** (`src/event-handler`)](src/event-handler/) - A component that handles messages received from queues and translates them into Audit Log events.

Lambdas:

* [**Message Receiver** (`src/lambdas/message-receiver`)](src/message-receiver/) - Receives messages from subscribed queues, embellishes with the source and format, and forwards onto the [Event Handler](event-handler/) Step Function.
* [**Retrieve Event from S3** (`src/lambdas/retrieve-event-from-s3`)](src/retrieve-event-from-s3/) - Retrieve the event content from S3 to use for processing, retrying or viewing where required.

Event Handler Lambdas:
* [**Record Event** (`src/lambdas/record-event`)](src/lambdas/record-event/) - Logs events against the parent AuditLog record in Dynamo.
* [**Translate Event** (`src/lambdas/translate-event`)](src/lambdas/translate-event) - Uses a factory pattern to determine the translation logic to apply to the message, based on it's known contextual format, in order to create an event to attach to a parent AuditLog record in the database.
* [**Transfer Messages** (`src/lambdas/transfer-messages`)](src/lambdas/transfer-messages) - Transfers incoming messages from the external incoming messages S3 bucket to the internal one.

Code shared between multiple components:

* [**Shared code** (`shared`)](src/shared/) - Library of code that is common to multiple components.
* [**Shared types** (`shared-types`)](src/shared-types/) - Library of typescript type/interface definitions that are used in multiple components.
* [**Shared testing** (`shared-testing`)](src/shared-testing/) - Library of shared code that is used for testing multiple components.

## Quick start

The majority of code in this repository is written in Typescript. In order to ensure you're using the right version of Node and npm, you should:

1. Install [`nvm`](https://github.com/nvm-sh/nvm)
2. In the root of this repository, run:
    ```shell
    $ nvm install
    $ nvm use
    ```

This will use the version specified in the [`.nvmrc`](.nvmrc) file.

You can then use the Makefile to get started:

```shell
# Build all components
$ make build-all

# Build a specific component, and any other components it depends on
$ make audit-log-api

# Run all components
$ make run-all

# Run all components except the portal
# (Useful if you want to run the portal separately with `npm run dev`)
$ make run-all-without-portal

# Stop running all components
$ make destroy

# Clear the build folders for all components
$ make clean

# Lint all of the code
$ make validate
```

## Development

### Build Order

Since we use shared local modules in these projects, there are some dependencies that denote a build order for dependent projects. The easiest way is to use the preset scripts to build:

```shell
$ make build
```

> Check the `scripts/projects` file to see the build order.

### Testing

The easiest way to run all tests is with the Make command:

```shell
$ make test
```

Where applicable, each component has tests that are run by Jest. To run these, simply run `npm test` from within the relevant project folder. Projects may also have different test scripts that you can run with the following commands:

- Run all tests - `npm test`
- Unit tests - `npm run test:unit`
- Integration tests - `npm run test:integration`
- Component-level end-to-end tests - `npm run test:e2e`
- UI tests - `npm run test:ui`
- Continuous Integration test run (run by the CI pipeline) - `npm run test:ci`

All of these approaches will execute tests in a watch mode, which will allow you to make changes to the underlying tests or codebase and then save the files to automatically trigger another test run.

> Note: Before running integration or end-to-end tests, you need to make sure you have rebuilt any changes using `npm run build:dev` in the respective project folder.

### Before Committing / Pushing

Before you commit and push your code, and especially before raising a pull request, make sure you run through the following steps first.

1. You have run `make validate` from the root of the repository and fixed any related errors or warnings.
1. You have built all projects using `make build`.
1. You have run `make test` and all tests pass.

# A note on running the docker container locally

Nginx is doing ssl termination and requires a certificate and key pair to be in the `/certs` path.
In order to run this locally you can generate a self-signed certificate and key using [this method](https://linuxize.com/post/creating-a-self-signed-ssl-certificate/) and then mount
this as a volume in your container

ie `docker run --rm -v /path/to/your/certificates:/certs -p 80:80 -p 443:443 -e API_URL=xxx audit-logging-portal:latest`

## Authors

This repository is developed and managed by the Made Tech team working on the Bichard7 project.

Tech Lead: [Ben Pirt](mailto:ben@madetech.com)
Delivery Manager: [Kayleigh Derricutt](mailto:Kayleigh.derricutt@madetech.com)
