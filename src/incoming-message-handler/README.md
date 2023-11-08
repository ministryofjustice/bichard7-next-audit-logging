# AWS Lambda: Incoming Message Handler

This is a series of AWS Lambda functions controlled by an AWS Step Function that has the responsibility to accept incoming messages from the ExISS API that sits between the Libra court system and Bichard7. The intention is that this allows us to log the message along with some contextual information, for later analysis and review by users in a separate part of the system. This process will then also reformat the message before sending it back into the rest of the Bichard7, if required. Below, is a diagram of the solution architecture for this part of the project.

![Bichard7 Audit Logging with AWS Step Functions](docs/infrastructure.png?raw=true "Infrastructure")

_Note:_ The step function definition lives in the infrastructure repository

## Debugging

Debugging is not currently supported for these Lambdas / Step Functions. However, you can output variables using `console.log()` and check them in the docker logs for the LocalStack container. To view logs, you need to run the following command:

```bash
$ docker logs -ft localstack_main
```

## Interacting with the infrastructure

### Active MQ

Messages that come through the lambda are sent off to an Active MQ queue once processing has complete. You can view these messages through the browser-based management console. Go to a web browser once the local infrastructure has been setup (see `environment/docker-compose.yml`) and enter the following:

> URL: **http://localhost:58161**

> Username: **admin**

> Password: **admin**

A queue will be created when a message is sent to the instance or a listener subscribes to it.
