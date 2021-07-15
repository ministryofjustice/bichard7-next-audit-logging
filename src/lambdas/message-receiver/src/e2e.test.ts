import { invokeFunction } from "@bichard/testing"
import type AmazonMqEventSourceRecordEvent from "./AmazonMqEventSourceRecordEvent"

test("given a message, the Step Function is invoked", async () => {
  const event: AmazonMqEventSourceRecordEvent = {
    eventSource: "",
    eventSourceArn: "",
    messages: [
      {
        messageID: "",
        messageType: "",
        data: ""
      }
    ]
  }

  const result = await invokeFunction("message-receiver", event)
  expect(result).toNotBeError()
})
