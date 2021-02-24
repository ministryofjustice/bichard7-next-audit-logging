import { SQSRecord } from "aws-lambda"
import SendRecordsUseCase from "./SendRecordsUseCase"
import MqGateway from "../gateways/MqGateway"

describe("sendRecords", () => {
  let gateway: MqGateway
  let useCase: SendRecordsUseCase
  let records: SQSRecord[]
  beforeAll(async () => {
    records = [
      {
        messageId: "1",
        receiptHandle: "",
        body: "message 1",
        attributes: {
          ApproximateReceiveCount: "",
          SenderId: "2",
          SentTimestamp: "",
          ApproximateFirstReceiveTimestamp: ""
        },
        messageAttributes: {},
        md5OfBody: "md5 Of Body",
        eventSource: "event source",
        eventSourceARN: "event Source ARN",
        awsRegion: "region"
      }
    ]
  })
  beforeEach(() => {
    gateway = new MqGateway({})
    useCase = new SendRecordsUseCase(gateway)
  })

  it("should handle successful calls", async () => {
    jest.spyOn(gateway, "execute").mockResolvedValue()
    await expect(useCase.sendRecords(records)).resolves.toEqual(undefined)
  })

  it("should handle failed calls", async () => {
    const error = new Error("Call failed")
    jest.spyOn(gateway, "execute").mockRejectedValue(error)
    try {
      await useCase.sendRecords(records)
    } catch (e) {
      expect(e).toEqual(error)
    }
  })
})
