# Bichard7 vNext: Services

A collection of service components to be hosted within AWS that will run as new parts of the Bichard7 architecture.

## Prerequisites

The following requirements must be installed to develop on and run the projects in this repository.

- [NodeJS and npm](https://nodejs.org/en/download/)
- [Python3 and pip](https://www.python.org/downloads/)
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- [AWS CLI Local](https://github.com/localstack/awscli-local)

## Projects

This repository currently contains multiple projects to support easy local referencing and development. The future vision is to move some/all of the individual projects out into their own repositories/packages. For more information on what the purpose of each project is, take a look at the README file for each.

1. [Handlers Common](shared/) - Library of components common to multiple projects in this repository
2. [API](audit-log-api/) - API exposing Audit Log records and attached events
3. [Incoming Message Handler](incoming-message-handler/) - AWS Step Functions and Lambdas for intercepting and processing messages coming into the Bichard system
4. [General Event Handler](general-event-handler/) - Lambda for transforming events coming from the Bichard system and attaching to Audit Log records
5. [Portal](audit-log-portal/) - Web-based portal allowing access to view and explore all Audit Log records and their events

## Development

### Build Order

Since we use shared local modules in these projects, there are some dependencies that denote a build order for dependent projects. The easiest way is to using the preset scripts to build:

```shell
$ scripts/install-all.sh
$ scripts/build-all.sh
```

> Check the `scripts/projects` file to see the build order.

You will also need to run `npm i` in the root directory to install any local configuration dependencies that manage the repository as a whole, such as Husky for pre-commit handling.

### Testing

Where applicable, each project has tests that are run by Jest. To run these, simply run `npm test` from within the relevant project folder. Projects may also have different test scripts that you can run with the following commands:

- Run all tests - `npm test`
- Unit tests - `npm run test:unit`
- Integration tests - `npm run test:integration`
- End-to-end tests - `npm run test:e2e`
- UI tests - `npm run test:ui`
- Continuous Integration test run (run by the CI pipeline) - `npm run test:ci`

All of these approaches will execute tests in a watch mode, which will allow you to make changes to the underlying tests or codebase and then save the files to automatically trigger another test run.

> Note: Before running integration or end-to-end tests, you need to make sure you have rebuilt any changes using `npm run build:dev` in the respective project folder.

### Before Committing / Pushing

Before you commit and push your code, and especially before raising a pull request, make sure you run through the following steps first.

1. All projects and modules build.
2. You have run `npm run lint` from the root of the repository and fixed any related errors or warnings.
3. You have built all projects using `npm run build` or `npm run build:dev` where applicable.
4. You have run `npm test` in all projects where appropriate and all tests pass.

## Authors

This repository is developed and managed by the Made Tech team working on the Bichard7 project.

Tech Lead: [Ben Pirt](mailto:ben@madetech.com)
Delivery Manager: [Kaiser Kahn](mailto:kaiser.kahn@madetech.com)
