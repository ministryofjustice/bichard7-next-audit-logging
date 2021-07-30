# Event Handler

This project brings together multiple lambdas and combines them within an AWS Step Function to orchestrate their workflow.

## Lambdas

The following lambdas are utilised within this component.

1. [Message Receiver](../lambdas/message-receiver/) - This is only used within the [e2e tests](e2e.test.ts) to test the full process. It's purpose is to receive a message in a defined format, embellish with extra data, and then invoke the Event Handler Step Function with that payload to start the workflow.
1. [Record Event](../lambdas/record-event/)
1. [Store in S3](../lambdas/store-in-s3/)
1. [Translate Event](../lambdas/translate-event/)

## Workflow

The lambdas are executed in the following order.

> Note: The workflow is defined in a [State Machine Definition File](scripts/state-machine.json.tpl) (this uses a [Terraform template syntax](https://www.terraform.io/docs/language/expressions/strings.html#interpolation)).

1. [Message Receiver](../lambdas/message-receiver/) - Takes 1 or more messages.
1. All messages are iterated and passed throught the rest of the workflow individually, as defined by the [Map](https://docs.aws.amazon.com/step-functions/latest/dg/amazon-states-language-map-state.html) step in the definition file.
1. [Store in S3](../lambdas/store-in-s3/)
1. [Translate Event](../lambdas/translate-event/)
1. [Record Event](../lambdas/record-event/)
