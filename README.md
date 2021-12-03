# Bichard7 Next: Audit Logging

A collection of service components to be hosted within AWS that will run as new parts of the Bichard7 architecture. Below, is a high-level diagram of the solution architecture.

![Bichard7 Audit Logging](/docs/infrastructure.png?raw=true "Infrastructure")

#### Quick access to other diagrams:
- [Incoming message handler](/incoming-message-handler)
- [Event handler](/src/event-handler)

## Prerequisites

The following requirements must be installed to develop on and run the projects in this repository.

- [NodeJS and npm](https://nodejs.org/en/download/)
- [Python3 and pip](https://www.python.org/downloads/)
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- [AWS CLI Local](https://github.com/localstack/awscli-local)
- [jq JSON processor](https://stedolan.github.io/jq/)
- GNU Make ([Linux](https://www.gnu.org/software/make/), [Mac](https://formulae.brew.sh/formula/make))

## Projects

This repository currently contains multiple projects to support easy local referencing and development. The future vision is to move some/all of the individual projects out into their own repositories/packages. For more information on what the purpose of each project is, take a look at the README file for each.

1. [Shared](shared/) - Library of components common to multiple projects in this repository. It is a work in progress to break this out into separate libraries under the `src/@bichard/` folder.
1. [Libraries](src/@bichard/) - A collection of shared libraries, separated into specific modules.
   1. [API Client](src/@bichard/api-client/)
   1. [MQ](src/@bichard/mq/)
   1. [S3](src/@bichard/s3/)
1. Testing Libraries - A collection of extensions for other shared libraries to support testing scenarios.
   1. [API Client](src/@bichard/testing-api-client/)
   1. [Config](src/@bichard/testing-config/)
   1. [DynamoDB](src/@bichard/testing-dynamodb/)
   1. [Jest](src/@bichard/testing-jest/)
   1. [Lambda](src/@bichard/testing-lambda/)
   1. [MQ](src/@bichard/testing-mq/)
   1. [S3](src/@bichard/testing-s3/)
1. [Lambdas](src/lambdas/) - A collection of Lambda projects stored individually for reuse in other components.
   1. [Message Receiver](src/lambdas/message-receiver/) - Receives messages from subscribed queues, embellishes with the source and format, and forwards onto the [Event Handler](src/event-handler/) Step Function.
   1. [Record Event](src/lambdas/record-event/) - Logs events against the parent AuditLog record in Dynamo.
   1. [Store in S3](src/lambdas/store-in-s3/) - Stores the event content (usually XML) as a file in S3 to use for retrying or viewing where required.
   1. [Translate Event](src/lambdas/translate-event/) - Uses a factory pattern to determine the translation logic to apply to the message, based on it's known contextual format, in order to create an event to attach to a parent AuditLog record in the database.
1. [API](audit-log-api/) - API exposing Audit Log records and attached events
1. [Incoming Message Handler](incoming-message-handler/) - AWS Step Functions and Lambdas for intercepting and processing messages coming into the Bichard system
1. [Event Handler](src/event-handler/) - A component that handles messages received from queues and translates them into Audit Log events.
1. [Portal](audit-log-portal/) - Web-based portal allowing access to view and explore all Audit Log records and their events

## Quickstart

Once all prerequisites are installed, you can do the followings:

- Run `make run-all` to deploy and run all components. After running this command, you should be able to access to the portal at [http://localhost:3000](http://localhost:3000)
  > Note: If you want to develop against the portal, you will need to instead run `make run-all-without-portal` and then launch the Portal from the `audit-log-portal/` folder with the command `npm run dev`.
- Run `make destroy` to destroy the local infrastructure.

## Development

### Build Order

Since we use shared local modules in these projects, there are some dependencies that denote a build order for dependent projects. The easiest way is to using the preset scripts to build:

```shell
$ make build
```

> Check the `scripts/projects` file to see the build order.

### Testing

The easiest way to run all tests is with the Make command:

```shell
$ make test
```

Where applicable, each project has tests that are run by Jest. To run these, simply run `npm test` from within the relevant project folder. Projects may also have different test scripts that you can run with the following commands:

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
