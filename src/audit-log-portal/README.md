# Audit Log Portal

This is a Next.js project. The purpose of which is to grant an admin a view of the messages recorded within the Bichard7 system along with any additional events of information.

## Development

In order to develop against this project locally, you have 2 options which you should choose based on your use case.

If you are making an aesthetic change then you can mock the `audit-log-api` and get up and running quickly with this command:

```sh
npm run dev:mocked
```

This should bring up the portal with some mocked data present.

If you need to test or make a change to the integration between the portal and api, it's important that you spin up the api first, use the following command to achieve this. In a new shell run:

```sh
npm run init:audit-log-api

```

This will run as a long running task running on port 3010

> Now the api is set up you can start the portal. In a new shell run:

```sh
npm i
npm run dev
```

The portal should now be running on port localhost:3020/audit-logging

> Note: Running the dev command will create a local `.env.local` file dynamically with the API endpoint.

## Testing

### Unit Tests

In order to run unit tests, you need to run the following command:

```sh
npm run test
```

### Integration Tests

Integration tests are built on cypress. Before running Integration tests, you need to run the application using the following command. This will run the application and mock the API:

```sh
npm run test:integration
```

To add more intergration tests see the [cypress dir](./cypress)

## Testing the host

The portal is hosted on AWS via ECS using a custom Docker Image. Follow these steps to build and run the image locally.

1. You will first need to make sure you have logged into the container registry in the AWS parent account. You will need
to make use of the AWS Vault for this, using the following command:

```sh
aws-vault exec <account_name> -- make build-portal-image
```

> Refer to [this](https://docs.aws.amazon.com/AmazonECR/latest/userguide/getting-started-cli.html#cli-authenticate-registry)
document for further guidance.
