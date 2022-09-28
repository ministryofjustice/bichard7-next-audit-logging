jest.retryTimes(10)
jest.setTimeout(10_000)
process.env.API_URL = "dummy"
process.env.API_KEY = "dummy"
import getErrorsToRetry from "./getErrorsToRetry"
import {
  createMockErrors,
  createMockError,
  createMockAuditLogs,
  createMockAuditLog,
  createMockRetriedError,
  auditLogDynamoConfig
} from "shared-testing"
import { TestDynamoGateway } from "shared"
import { isError } from "shared-types"
import { AuditLogApiClient } from "shared"
const apiClient = new AuditLogApiClient("http://localhost:3010", "DUMMY")

const testDynamoGateway = new TestDynamoGateway(auditLogDynamoConfig)

describe("getErrorsToRetry", () => {
  beforeEach(async () => {
    await testDynamoGateway.deleteAll(auditLogDynamoConfig.TABLE_NAME, "messageId")
  })

  it("should get all errors, paginating where necessary", async () => {
    const count = 12
    await createMockErrors(count, new Date(Date.now() - 3600000))
    await createMockAuditLogs(1)
    const errors = await getErrorsToRetry(apiClient, 13)
    expect(errors).toHaveLength(count)
  })

  it("should ignore the errors that don't need retrying", async () => {
    const record = await createMockError(new Date(Date.now() - 3600000))
    if (isError(record)) {
      throw new Error("Error creating mock error")
    }
    await createMockRetriedError()
    await createMockAuditLog()
    await createMockError()
    const errors = await getErrorsToRetry(apiClient, 3)
    if (isError(errors)) {
      throw new Error("Error getting errors to retry")
    }
    expect(errors).toHaveLength(1)
    expect(errors[0].messageId).toEqual(record.messageId)
  })

  it("should only fetch the requested number of errors", async () => {
    await createMockErrors(2, new Date(Date.now() - 3600000))
    const errors = await getErrorsToRetry(apiClient, 1)
    expect(errors).toHaveLength(1)
  })
})
