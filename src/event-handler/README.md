# Event Handler

This project brings together multiple lambdas and combines them within an AWS Step Function to orchestrate their workflow. Below, is a diagram of the solution architecture for this part of the project.

![Bichard7 Audit Logging - Event Handler](docs/infrastructure.png?raw=true "Infrastructure")

## Lambdas

The following lambdas are utilised within this component.

1. [Message Receiver](../lambdas/message-receiver/) - This is only used within the [e2e tests](e2e.test.ts) to test the full process. It's purpose is to receive a message in a defined format, embellish with extra data, and then store it in S3 bucket.
1. [Record Event](../lambdas/record-event/)
1. [Retrieve Event from S3](../lambdas/retrieve-event-from-s3/)
1. [Translate Event](../lambdas/translate-event/)

## Workflow

The lambdas are executed in the following order.

> Note: The workflow is defined in a [State Machine Definition File](scripts/state-machine.json.tpl) (this uses a [Terraform template syntax](https://www.terraform.io/docs/language/expressions/strings.html#interpolation)).

1. [Message Receiver](../lambdas/message-receiver/) - Takes 1 or more messages and store them in S3 bucket.
1. Each message is passed through the rest of the workflow individually, as defined in the definition file.
1. [Retrieve Event From S3](../lambdas/retrieve-event-from-s3/)
1. [Translate Event](../lambdas/translate-event/)
1. [Record Event](../lambdas/record-event/)
