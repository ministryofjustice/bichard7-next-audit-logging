jest.setTimeout(30000)

import "@bichard/testing-jest"
import { invokeFunction } from "@bichard/testing-lambda"
import type { AmazonMqEventSourceRecordEvent } from "shared"

test("given a message, the Step Function is invoked", async () => {
  const event: AmazonMqEventSourceRecordEvent = {
    eventSource: "",
    eventSourceArn: "",
    messages: [
      {
        messageID: "",
        messageType: "",
        data: "",
        destination: {
          physicalName: ""
        }
      }
    ]
  }

  const result = await invokeFunction("message-receiver", event)
  expect(result).toNotBeError()
})
