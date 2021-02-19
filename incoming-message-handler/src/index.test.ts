import { SQSEvent } from "aws-lambda"
import SendRecordsUseCase from "./use-cases/sendRecords"
import { sendMessage } from "."

jest.mock("./use-cases/sendRecords")

describe("sendMessage", () => {
  const records = [
    {
      messageId: "1",
      receiptHandle: "",
      body: "message 1",
      attributes: {
        ApproximateReceiveCount: "",
        SenderId: "2",
        SentTimestamp: "",
        ApproximateFirstReceiveTimestamp: ""
      }
    },
    {
      messageId: "2",
      receiptHandle: "",
      body: "message 2",
      attributes: {
        ApproximateReceiveCount: "",
        SenderId: "2",
        SentTimestamp: "",
        ApproximateFirstReceiveTimestamp: ""
      }
    }
  ]
  beforeAll(async () => {
    const event = { Records: records }
    sendMessage(event as SQSEvent)
  })

  it("should send the records only", async () => {
    expect(SendRecordsUseCase).toHaveBeenCalledTimes(1)
  })
})
