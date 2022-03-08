import "shared-testing"
import { setEnvironmentVariables } from "shared-testing"
import type { DynamoDbConfig, S3Config } from "shared-types"
import { AuditLog, BichardAuditLogEvent } from "shared-types"
import recordErrorArchival from "."

setEnvironmentVariables()

const originalEnv = process.env

describe("Record Error Archival end-to-end", () => {
  beforeEach(() => {
    jest.resetModules() // reset the cache of all required modules
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      ARCHIVE_USER_LOGS_BUCKET: "test-bucket",
      REGION: "test-region"
    }
  })

  afterEach(() => {
    process.env = originalEnv // reset env vars
  })

  it("Should create an audit log event when an error record is archived", async () => {
    const batchSize = 10
    await recordErrorArchival(batchSize)
    expect().toBeTruthy()
  })
})
