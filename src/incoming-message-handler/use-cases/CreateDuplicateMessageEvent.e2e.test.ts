import "../../shared/testing/jest"
import CreateDuplicateMessageEvent from "./CreateDuplicateMessageEvent"
import type { OutputApiAuditLog } from "src/shared/types"
import { AuditLogApiClient } from "src/shared"
import { mockInputApiAuditLog } from "src/shared/testing"
import MockDate from "mockdate"
import { v4 as uuid } from "uuid"

const apiClient = new AuditLogApiClient("http://localhost:3010", "Dummy key")
const useCase = new CreateDuplicateMessageEvent(apiClient)

describe("createDuplicateMessageEvent", () => {
  let existingMessageId: string
  let existingMessageHash: string

  beforeEach(async () => {
    jest.clearAllMocks()
    const auditLog = mockInputApiAuditLog()
    await apiClient.createAuditLog(auditLog)
    existingMessageId = auditLog.messageId
    existingMessageHash = auditLog.messageHash
  })

  afterEach(() => {
    MockDate.reset()
    jest.clearAllMocks()
  })

  it("should add duplicate message event to the audit log", async () => {
    const expectedTimestamp = new Date("2023-03-29T11:00:00.000Z")
    MockDate.set(expectedTimestamp)

    const duplicateAuditLog = mockInputApiAuditLog({
      s3Path: "/dummy/path",
      receivedDate: "2023-03-29T10:12:00.000Z",
      externalId: "dummyExternalId",
      externalCorrelationId: "dummyExternalCorrelationId",
      stepExecutionId: "DummyStepFunctionExecutionId",
      messageHash: existingMessageHash
    })

    const result = await useCase.execute(duplicateAuditLog)
    expect(result).toNotBeError()

    const actualMessage = await apiClient.getMessage(existingMessageId)
    const { events: actualEvents } = actualMessage as OutputApiAuditLog
    expect(actualEvents).toStrictEqual([
      {
        attributes: {
          externalId: "dummyExternalId",
          stepExecutionId: "DummyStepFunctionExecutionId",
          s3Path: "/dummy/path",
          receivedDate: "2023-03-29T10:12:00.000Z",
          externalCorrelationId: "dummyExternalCorrelationId"
        },
        category: "information",
        eventCode: "audit-log.duplicate-message",
        eventSource: "Incoming Message Handler",
        eventType: "Duplicate message",
        timestamp: expectedTimestamp.toISOString()
      }
    ])
  })

  it("should return error if audit log does not exist", async () => {
    const duplicateAuditLog = mockInputApiAuditLog({
      s3Path: "/dummy/path",
      receivedDate: "2023-03-29T10:12:00.000Z",
      externalId: "dummyExternalId",
      externalCorrelationId: "dummyExternalCorrelationId",
      stepExecutionId: "DummyStepFunctionExecutionId",
      messageHash: uuid()
    })

    const result = await useCase.execute(duplicateAuditLog)
    expect(result).toBeError(
      `Error creating event: A message with hash ${duplicateAuditLog.messageHash} does not exist in the database`
    )
  })

  it("should return error if api client returns error", async () => {
    const expectedError = new Error("Dummy error")
    jest.spyOn(apiClient, "createEvent").mockResolvedValue(expectedError)

    const duplicateAuditLog = mockInputApiAuditLog({
      s3Path: "/dummy/path",
      receivedDate: "2023-03-29T10:12:00.000Z",
      externalId: "dummyExternalId",
      externalCorrelationId: "dummyExternalCorrelationId",
      stepExecutionId: "DummyStepFunctionExecutionId",
      messageHash: existingMessageHash
    })
    const result = await useCase.execute(duplicateAuditLog)
    expect(result).toBeError("Dummy error")
  })
})
