import { SQSRecord } from "aws-lambda"
import SendRecordsUseCase from "./sendRecords"
import MqGateway from "../gateways/MqGateway"

const mockExecute = jest.fn()
jest.mock("../gateways/MqGateway", () => {
  return jest.fn().mockImplementation(() => {
    return { execute: mockExecute }
  })
})

describe("sendRecords", () => {
  beforeAll(async () => {
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
    const gateway = new MqGateway({})
    const useCase = new SendRecordsUseCase(gateway)
    await useCase.sendRecords(records as SQSRecord[])
  })
  it("should create a gateway api instance", async () => {
    expect(MqGateway).toHaveBeenCalledTimes(1)
  })

  it("should call the execute function for each record", async () => {
    expect(mockExecute).toHaveBeenCalledTimes(2)
  })
})
