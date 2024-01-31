import "src/shared/testing"
import { FakeApiClient, mockOutputApiAuditLog } from "src/shared/testing"
import { AuditLogStatus } from "src/shared/types"
import CreateAuditLogUseCase from "./CreateAuditLogUseCase"

const apiClient = new FakeApiClient()
const useCase = new CreateAuditLogUseCase(apiClient)
const message = mockOutputApiAuditLog({
  externalCorrelationId: "b5edf595-16a9-450f-a52b-40628cd58c29",
  messageHash: "hash-1",
  status: AuditLogStatus.duplicate
})

describe("CreateAuditLogUseCase", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return duplicate validation result when audit log status is duplicate", async () => {
    const result = await useCase.execute(message)

    expect(result).toNotBeError()
    expect(result).toEqual({
      isValid: false,
      isDuplicate: true,
      generateDuplicateEvent: false
    })
  })
})
