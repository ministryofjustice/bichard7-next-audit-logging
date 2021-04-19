# Audit Log Portal

This is a Next.js project. The purpose of which is to grant an admin a view of the messages recorded within the Bichard7 system along with any additional events of information.

## Development

In order to develop against this project locally, you will need to install the dependencies and then run the dev command.

> Note: Before running this command, you will need to ensure that the [Audit Log API](../audit-log-api#README.md) is running first.

```shell
npm i
npm run dev
```

> Note: Running the dev command will create a local `.env.local` file dynamically with the API endpoint.

## Testing the host

The portal is hosted on AWS via a host lambda. This can be somewhat tested locally by running the following command:

```shell
npm run host
```

This will run through the following steps:

1. Build a production output of the portal
2. Ensure the LocalStack environment is available
3. Ensure the Audit Log API is running locally
4. Create the host lambda
5. Setup a local HTTP proxy to handle HTTP requests and pipe them into the lambda

You should then be able to browse to the portal via the URL `http://localhost:8080`
