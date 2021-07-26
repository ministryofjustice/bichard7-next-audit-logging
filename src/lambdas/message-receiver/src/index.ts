import { isError } from "shared"
import type { AmazonMqEventSourceRecordEvent, MessageFormat } from "shared"
import createStepFunctionConfig from "./createStepFunctionConfig"
import embellishMessages from "./embellishMessages"
import StepFunctionInvocationGateway from "./StepFunctionInvocationGateway"

const messageFormat = process.env.MESSAGE_FORMAT as MessageFormat
if (!messageFormat) {
  throw new Error("MESSAGE_FORMAT is either unset or an unsupported value")
}

const gateway = new StepFunctionInvocationGateway(createStepFunctionConfig())

export default async (event: AmazonMqEventSourceRecordEvent): Promise<void> => {
  if (!event.messages || event.messages.length === 0) {
    throw new Error("No messages were found in the event")
  }

  const events = embellishMessages(event, messageFormat)
  const result = await gateway.execute(events)

  if (isError(result)) {
    throw result
  }
}
