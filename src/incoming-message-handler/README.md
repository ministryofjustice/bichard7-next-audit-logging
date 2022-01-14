# AWS Lambda: Incoming Message Handler

This is a series of AWS Lambda functions controlled by an AWS Step Function that has the responsibility to accept incoming messages from the ExISS API that sits between the Libra court system and Bichard7. The intention is that this allows us to log the message along with some contextual information, for later analysis and review by users in a separate part of the system. This process will then also reformat the message before sending it back into the rest of the Bichard7, if required. Below, is a diagram of the solution architecture for this part of the project.

![Bichard7 Audit Logging with AWS Step Functions](docs/infrastructure.png?raw=true "Infrastructure")

## Debugging

Debugging is not currently supported for these Lambdas / Step Functions. However, you can output variables using `console.log()` and check them in the docker logs for the LocalStack container. To view logs, you need to run the following command:

```bash
$ docker logs -ft localstack_main
```

## Interacting with the infrastructure

### Active MQ

Messages that come through the lambda are sent off to an Active MQ queue once processing has complete. You can view these messages through IBM's browser-based management console. Go to a web browser once the local infrastructure has been setup (see `environment/docker-compose.yml`) and enter the following:

> URL: **http://localhost:58161**

> Username: **admin**

> Password: **admin**

A queue will be created when a message is sent to the instance or a listener subscribes to it.

### LocalStack (Local AWS Infrastructure)

You can view all logs output by the local AWS infrastructure (including the lambda) but watching the Docker logs for the LocalStack container. This is named `localstack_main`. The easiest way to do this, is to run the following command from the terminal:

```bash
$ docker logs -ft localstack_main
```

You can also interact directly with the local infrastructure in the same way that you would with infrastructure deployed into AWS itself. You can either use the native AWS CLI by specifying the `--endpoint-url` parameter, or you can use the AWS LOCAL CLI tool (which is a thin wrapper around the AWS CLI but with the endpoint pre-configured).

```bash
# Using the AWS CLI
aws --endpoint-url http://localhost:4566 dynamodb list-tables
