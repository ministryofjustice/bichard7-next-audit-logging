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

1. [Handlers Common](handlers-common/) - local npm library
2. [Incoming Message Handler](incoming-message-handler/) - AWS Step Functions and Lambdas

## Development

### Build Order

Since we use shared local modules in these projects, there are some dependencies that denote a build order for dependent projects.

1. `@handlers/common` - Run `npm run build` from within the `handlers-common/` folder. This is a shared module.
2. `incoming-message-handler` - Run `npm run build:dev` from within the `incoming-message-handler/` folder. This is an AWS Lambda project.

> Note: Be sure to run `npm i` before building any project. Also, make sure you build the `@handlers/common` module and then build (or rebuild) the `incoming-message-handler` project, as this will copy across the shared module into the output `build/` directory.

You will also need to run `npm i` in the root directory to install any local configuration dependencies that manage the repository as a whole, such as Husky for pre-commit handling.

### Testing

Where applicable, each project has tests that are run by Jest. To run these, simply run `npm test` from within the relevant project folder. Projects may also have different test scripts that you can run with the following commands:

- Unit tests - `npm run test:unit`
- Integration tests - `npm run test:integration`
- End-to-end tests - `npm run test:e2e`
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
