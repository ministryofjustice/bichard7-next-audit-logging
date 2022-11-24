import MockDate from "mockdate"
import "src/shared/testing"
import { mockDynamoAuditLog, mockDynamoAuditLogEvent } from "src/shared/testing"
import type { DynamoAuditLog, DynamoAuditLogEvent, PromiseResult } from "src/shared/types"
import { EventCode } from "src/shared/types"
import { FakeAuditLogDynamoGateway } from "../test"
import SanitiseAuditLogUseCase from "./SanitiseAuditLogEventsUseCase"

const fakeAuditLogDynamoGateway = new FakeAuditLogDynamoGateway()
const sanitiseAuditLogUseCase = new SanitiseAuditLogUseCase(fakeAuditLogDynamoGateway)

let mockReplaceAuditLogEvents: jest.SpyInstance<PromiseResult<void>, [_: DynamoAuditLogEvent[]]>
let mockUpdate: jest.SpyInstance<PromiseResult<void>, [_: DynamoAuditLog, __: Partial<DynamoAuditLog>]>

const message = mockDynamoAuditLog({
  events: [
    mockDynamoAuditLogEvent({
      attributes: {
        "Trigger 2 Details": "TRPR0004",
        "Original Hearing Outcome / PNC Update Dataset": "<?xml><dummy></dummy>",
        OriginalHearingOutcome: "<?xml><dummy></dummy>",
        OriginalPNCUpdateDataset: "<?xml><dummy></dummy>",
        PNCUpdateDataset: "<?xml><dummy></dummy>",
        AmendedHearingOutcome: "<?xml><dummy></dummy>",
        AmendedPNCUpdateDataset: "<?xml><dummy></dummy>"
      }
    })
  ]
})

describe("SanitiseAuditLogEventsUseCase", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockReplaceAuditLogEvents = jest
      .spyOn(fakeAuditLogDynamoGateway, "replaceAuditLogEvents")
      .mockResolvedValue(undefined)

    mockUpdate = jest.spyOn(fakeAuditLogDynamoGateway, "update").mockResolvedValue(undefined)

    jest.spyOn(fakeAuditLogDynamoGateway, "fetchOne").mockResolvedValue(message)
  })

  afterAll(() => MockDate.reset())

  it("should remove attributes containing PII", async () => {
    const sanitiseAuditLogResult = await sanitiseAuditLogUseCase.call(message)
    expect(sanitiseAuditLogResult).toNotBeError()

    const newAttributes = mockReplaceAuditLogEvents.mock.calls[0][0][0].attributes
    expect(newAttributes).toHaveProperty("Trigger 2 Details")
    expect(newAttributes).not.toHaveProperty("Original Hearing Outcome / PNC Update Dataset")
    expect(newAttributes).not.toHaveProperty("OriginalHearingOutcome")
    expect(newAttributes).not.toHaveProperty("OriginalPNCUpdateDataset")
    expect(newAttributes).not.toHaveProperty("PNCUpdateDataset")
    expect(newAttributes).not.toHaveProperty("AmendedHearingOutcome")
    expect(newAttributes).not.toHaveProperty("AmendedPNCUpdateDataset")
  })

  it("should add a new event when the audit log is successfully sanitised", async () => {
    const sanitiseAuditLogResult = await sanitiseAuditLogUseCase.call(message)
    expect(sanitiseAuditLogResult).toNotBeError()

    const latestEvent = mockUpdate.mock.calls[0][1].events?.slice(-1)[0]
    expect(latestEvent).toHaveProperty("eventCode", EventCode.Sanitised)
    expect(latestEvent).toHaveProperty("eventType", "Sanitised message")
  })

  it("should automatically delete sensitive attributes", async () => {
    const sensitiveMessage = mockDynamoAuditLog({
      events: [
        mockDynamoAuditLogEvent({
          attributes: {
            "Trigger 2 Details": "TRPR0004",
            sensitiveAttributes: "attr1,attr2",
            attr1: "to delete",
            attr2: "to delete"
          }
        })
      ]
    })
    const sanitiseAuditLogResult = await sanitiseAuditLogUseCase.call(sensitiveMessage)
    expect(sanitiseAuditLogResult).toNotBeError()

    const newAttributes = mockReplaceAuditLogEvents.mock.calls[0][0][0].attributes
    expect(newAttributes).toHaveProperty("Trigger 2 Details")
    expect(newAttributes).not.toHaveProperty("attr1")
    expect(newAttributes).not.toHaveProperty("attr2")
  })
})
