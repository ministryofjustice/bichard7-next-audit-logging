# AWS Lambda: Incoming Message Handler

This is an AWS Lambda function that has the responsibility to accept incoming messages from the ExISS API that sits between the Libra court system and Bichard7. The intention is that this allows us to log the message along with some contextual information, for later analysis and review by users in a separate part of the system. This lambda will then also reformat the message before sending it back into the rest of the Bichard7.

## Debugging

This project uses the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) to support debugging the lambda locally. This is a prerequisite to allow you to debug this application. Once installed, you will need to make sure the local infrastructure is fully setup. The easiest way to do this is to run `npm run test:integration`. This will spin up the local infrastructure and make sure all parts are available on the Docker network `bichard_audit_logging`. Once up, you can then debug this application from within Visual Studio Code by hitting F5 (or selecting `Launch Lambda in Debug Mode` from the Debug menu). This will break in a random `index.js` file, which will give you time to set the breakpoint in the TypeScript lambda code where you require. Once you have done that, you can hit F5 to jump to your breakpoint, and debug from there.

## Interacting with the infrastructure

### IBM MQ

Messages that come through the lambda are sent off to an IBM MQ queue once processing has complete. You can view these messages through IBM's browser-based management console. Go to a web browser once the local infrastructure has been setup (see `environment/docker-compose.yml`) and enter the following:

> URL: **https://localhost:10443**

> Username: **admin**

> Password: **passw0rd**

Currently, all messages are sent to the queue `DEV.QUEUE.1` on the queue manager `BR7_QM`.

### LocalStack (Local AWS Infrastructure)

You can view all logs output by the local AWS infrastructure (including the lambda) but watching the Docker logs for the LocalStack container. This is named `localstack_main`. The easiest way to do this, is to run the following command from the terminal:

```bash
$ docker logs -ft localstack_main
```

You can also interact directly with the local infrastructure in the same way that you would with infrastructure deployed into AWS itself. You can either use the native AWS CLI by specifying the `--endpoint-url` parameter, or you can use the AWS LOCAL CLI tool (which is a thin wrapper around the AWS CLI but with the endpoint pre-configured).

```bash
# Using the AWS CLI
aws --endpoint-url http://localhost:4566 dynamodb list-tables

# Using the AWS LOCAL CLI
awslocal dynamodb list-tables
```
