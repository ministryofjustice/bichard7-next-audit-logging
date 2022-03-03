import validateMessageHash from "./validateMessageHash"
import { FakeApiClient } from "shared-testing"
import { AuditLog } from "shared-types"

const apiClient = new FakeApiClient()

describe("validateMessageHash", () => {
  it("should return undefined when hash does not exist in the database", async () => {
    const auditLog = new AuditLog("ID-1", new Date(), "dummy hash")
    apiClient.reset([auditLog])

    const result = await validateMessageHash("non-existent hash", apiClient)

    expect(result).toBeUndefined()
  })

  it("should return invalid result when hash exists in the database", async () => {
    const auditLog = new AuditLog("ID-1", new Date(), "duplicate hash")
    apiClient.reset([auditLog])

    const result = await validateMessageHash("duplicate hash", apiClient)

    expect(result).toBeDefined()
    expect(result?.messageHashValidationResult.isValid).toBe(false)
    expect(result?.messageHashValidationResult.message).toBe(
      "There is a message with the same hash in the database (duplicate hash)"
    )
  })
})
