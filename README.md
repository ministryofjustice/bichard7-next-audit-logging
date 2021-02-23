# Bichard7 vNext: Services

A collection of service components to be hosted within AWS that will run as new parts of the Bichard7 architecture.

## Prerequisites

The following requirements must be installed to develop on and run the projects in this repository.

- NodeJS and npm
- Python3 and pip
- Docker
- Docker Compose
- AWS CLI
- AWS CLI Local

## Development

### Build Order

Since we use shared local modules in these projects, there are some dependencies that denote a build order for dependent projects.

1. `@handlers/common` - Run `npm run build` from within the `handlers-common/` folder. This is a shared module.
2. `incoming-message-handler` - Run `npm run build` from within the `incoming-message-handler/` folder. This is an AWS Lambda project.

> Note: Be sure to run `npm i` before building any project. Also, make sure you build the `@handlers/common` module and then build (or rebuild) the `incoming-message-handler` project, as this will copy across the shared module into the output `build/` directory.

### Testing

Where applicable, each project has tests that are run by Jest. To run these, simply run `npm test` from within the relevant project folder. Projects may also have integration tests, which you can run with `npm run test:integration`. Both of these approaches will execute tests in a watch mode, which will allow you to make changes to the underlying tests or codebase and then save the files to automatically trigger another test run.

## Authors

This repository is developed and managed by the Made Tech team working on the Bichard7 project.

Tech Lead: [Ben Pirt](mailto:ben@madetech.com)
Delivery Manager: [Kaiser Kahn](mailto:kaiser.kahn@madetech.com)
