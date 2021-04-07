# Audit Log API

This project provides the API for accessing everything relating to Audit Log records. These come from messages from an external system, and also comprise of events emitted from the internal Bichard7 system. The API is built as an AWS API Gateway and backed by individual AWS Lambda Functions to serve each individual endpoint.

> Note: Check prerequisites in the main [README](..#README.md) at the root of the repository.

## Development

When making changes, you must re-build the code after making the changes.

```bash
# Be sure to install dependencies first
npm i

# For development builds
npm run build:dev

# For production builds
npm run build
```

If you want to run the API so that other projects can interact with it, or so you can test it manually, run the start command:

```bash
npm start
```

This will spin up the local AWS-simulated infrastructure (provided via LocalStack) if it isn't already up and running. It will then deploy any common infrastructure, as well as the API-specific components. Finally, it will build the project so that the Lambda(s) can be accessed.

## Testing

There are a number of different testing commands that can be run:

| Command | Description |
| `npm test` | This will run all tests in the watch mode |
| `npm run test:unit` | This will only run Unit tests, which don't require external resources |
| `npm run test:integration` | This will only run Integration tests, which will require external resources |
| `npm run test:e2e` | This will only run End-to-End tests, which will require external resources |

## Querying the API

Once you have started the API with `npm start`, it will be available on an endpoint such as http://localhost:4566/restapis/.... This will be slightly different each time you spin it up as it includes the Id of the API when created in LocalStack. You should see the endpoint echoed in the terminal once the command has complete. You can then run a simple cURL command (or use a tool such as Postman) to query the API.

```bash
# Example - get messages
curl http://localhost:4566/restapis/ivoo55uouz/dev/_user_request_/messages

# Response
{messages:[]}
```

> Note: The `_user_request_` part of the URL is hardcoded in [LocalStack](https://github.com/atlassian/localstack/blob/master/localstack/constants.py#L81).
