jest.setTimeout(10_000)
process.env.API_URL = "dummy"
process.env.API_KEY = "dummy"
import { AuditLogApiClient } from "src/shared"
import {
  clearDynamoTable,
  createMockAuditLog,
  createMockAuditLogs,
  createMockError,
  createMockErrors,
  createMockRetriedError
} from "src/shared/testing"
import { isError } from "src/shared/types"
import getErrorsToRetry from "./getErrorsToRetry"

const apiClient = new AuditLogApiClient("http://localhost:3010", "DUMMY")

const baseConfig = {
  maxRetryAttempts: 3,
  initialRetryDelay: 1_800_000,
  retryDelay: 86_400_000,
  errorsToRetry: 100
}

describe("getErrorsToRetry", () => {
  beforeEach(async () => {
    await clearDynamoTable("auditLogTable", "messageId")
    await clearDynamoTable("auditLogEventsTable", "_id")
  })

  it("should get all errors, paginating where necessary", async () => {
    const count = 102
    await createMockErrors(count, { receivedDate: new Date(Date.now() - 3600000).toISOString() })
    await createMockAuditLogs(1)

    const errors = await getErrorsToRetry(apiClient, { ...baseConfig, errorsToRetry: 103 })
    expect(errors).toHaveLength(count)
  })

  it("should ignore the errors that don't need retrying", async () => {
    const record = await createMockError({ receivedDate: new Date(Date.now() - 3600000).toISOString() })
    if (isError(record)) {
      throw new Error("Error creating mock error")
    }
    await createMockRetriedError()
    await createMockAuditLog()
    await createMockError()

    const errors = await getErrorsToRetry(apiClient, { ...baseConfig, errorsToRetry: 3 })
    if (isError(errors)) {
      throw new Error("Error getting errors to retry")
    }
    expect(errors).toHaveLength(1)
    expect(errors[0].messageId).toEqual(record.messageId)
  })

  it("should only fetch the requested number of errors", async () => {
    await createMockErrors(2, { receivedDate: new Date(Date.now() - 3600000).toISOString() })

    const errors = await getErrorsToRetry(apiClient, { ...baseConfig, errorsToRetry: 1 })
    expect(errors).toHaveLength(1)
  })
})
