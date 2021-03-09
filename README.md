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

## Development

### Build Order

Since we use shared local modules in these projects, there are some dependencies that denote a build order for dependent projects.

1. `@handlers/common` - Run `npm run build` from within the `handlers-common/` folder. This is a shared module.
2. `incoming-message-handler` - Run `npm run build` from within the `incoming-message-handler/` folder. This is an AWS Lambda project.

> Note: Be sure to run `npm i` before building any project. Also, make sure you build the `@handlers/common` module and then build (or rebuild) the `incoming-message-handler` project, as this will copy across the shared module into the output `build/` directory.

You will also need to run `npm i` in the root directory to install any local configuration dependencies that manage the repository as a whole, such as Husky for pre-commit handling.

### Testing

Where applicable, each project has tests that are run by Jest. To run these, simply run `npm test` from within the relevant project folder. Projects may also have integration tests, which you can run with `npm run test:integration`. Both of these approaches will execute tests in a watch mode, which will allow you to make changes to the underlying tests or codebase and then save the files to automatically trigger another test run.

> Note: Before running integration tests, you need to make sure you have rebuilt any changes using `npm run build` in the respective project folder.

### Before Committing / Pushing

Before you commit and push your code, and especially before raising a pull request, make sure you run through the following steps first.

1. All projects and modules build.
2. You have run `npm run lint` from the root of the repository and fixed any related errors or warnings.
3. You have run both `npm test` and `npm run test:integration` in all projects where appropriate and all tests pass.

## Authors

This repository is developed and managed by the Made Tech team working on the Bichard7 project.

Tech Lead: [Ben Pirt](mailto:ben@madetech.com)
Delivery Manager: [Kaiser Kahn](mailto:kaiser.kahn@madetech.com)
