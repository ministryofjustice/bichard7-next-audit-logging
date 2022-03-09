import "shared-testing"
import { AuditLogApiClient } from "shared"
import { mockAuditLog } from "shared-testing"
import CreateAuditLogUseCase from "./CreateAuditLogUseCase"
import type { ValidationResult } from "src/handlers/storeMessage"
import type { AuditLog } from "shared-types"

const apiClient = new AuditLogApiClient("http://localhost:3010", "Dummy key")
const useCase = new CreateAuditLogUseCase(apiClient)

describe("CreateAuditLogUseCase", () => {
  it("should create an audit log record", async () => {
    const auditLog = mockAuditLog()

    const result = await useCase.execute(auditLog)

    expect(result).toBeDefined()
    expect(result).toNotBeError()

    const { isValid } = result as ValidationResult
    expect(isValid).toBe(true)
  })

  it("should fail the validation when message hash already exists", async () => {
    const auditLog1 = mockAuditLog()

    const result1 = await useCase.execute(auditLog1)

    expect(result1).toBeDefined()
    expect(result1).toNotBeError()

    const auditLog2 = { ...mockAuditLog(), messageHash: auditLog1.messageHash }

    const result2 = await useCase.execute(auditLog2)

    expect(result2).toBeDefined()
    expect(result2).toNotBeError()

    const { isValid, message } = result2 as ValidationResult
    expect(isValid).toBe(false)
    expect(message).toBe(`There is a message with the same hash in the database (${auditLog2.messageHash})`)
  })

  it("should return error when API returns error", async () => {
    const auditLog = { ...mockAuditLog(), receivedDate: undefined } as unknown as AuditLog

    const result = await useCase.execute(auditLog)

    expect(result).toBeError("Error creating audit log: Received date is mandatory")
  })
})
