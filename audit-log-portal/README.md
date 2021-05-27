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

## Testing

### Unit Tests

In order to run unit tests, you need to run the following command:

```bash
npm run test
```

### UI Tests

Before running UI tests, you need to run the application using the following command. This will run the application and mock the API:

```bash
npm run start:mocked
```

Once the application is running, you can run UI tests by running the command below:

```bash
npm run test:ui
```

## Testing the host

The portal is hosted on AWS via ECS using a custom Docker Image. Follow these steps to build and run the image locally.

1. You will first need to make sure you have logged into the container registry in the AWS parent account. You will need
to make use of the AWS Vault for this, using the following command:

```shell
aws-vault exec <account_name> -- \
  aws ecr get-login-password --region <region> | \
  docker login -u AWS --password-stdin <aws_account_id>.dkr.ecr.<region>.amazonaws.com
```

> Refer to [this](https://docs.aws.amazon.com/AmazonECR/latest/userguide/getting-started-cli.html#cli-authenticate-registry)
document for further guidance.

* <account_name> is the name of the name of the account to use as registered in AWS Vault. It is the account containing the
ECR images you want to access.
* <region> is the region the account is in - this is most likely `eu-west-2`.
* <aws_account_id> is the Id of the AWS Account containing the ECR images you want to access.

You can now build the image. Run the following command from the repository root:

```shell
make build-portal-image
```
