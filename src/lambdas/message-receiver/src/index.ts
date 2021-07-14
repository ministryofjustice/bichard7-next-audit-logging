import type { MessageFormat } from "shared"
import type AmazonMqEventSourceRecordEvent from "./AmazonMqEventSourceRecordEvent"
import embellishMessages from "./embellishMessages"

const messageFormat = process.env.MESSAGE_FORMAT as MessageFormat
if (!messageFormat) {
  throw new Error("MESSAGE_FORMAT is either unset or an unsupported value")
}

export default (event: AmazonMqEventSourceRecordEvent): void => {
  if (!event.messages || event.messages.length === 0) {
    throw new Error("No messages were found in the event")
  }

  const events = embellishMessages(event, messageFormat)
  // eslint-disable-next-line no-console
  console.log(events)

  // TODO: Invoke Step Function
}
