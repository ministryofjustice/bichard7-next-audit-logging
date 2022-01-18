jest.retryTimes(10)
import getAllErrors from "./getAllErrors"
import { createMockErrors, createMockAuditLogs } from "shared-testing"
import { TestDynamoGateway } from "shared"
import type { DynamoDbConfig } from "shared-types"
import { AuditLogApiClient } from "shared"
const apiClient = new AuditLogApiClient("http://localhost:3010", "DUMMY")

const dynamoConfig: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:8000",
  DYNAMO_REGION: "eu-west-2",
  AUDIT_LOG_TABLE_NAME: "auditLogTable",
  AWS_ACCESS_KEY_ID: "DUMMY",
  AWS_SECRET_ACCESS_KEY: "DUMMY"
}
const testDynamoGateway = new TestDynamoGateway(dynamoConfig)

describe("getAllErrors", () => {
  beforeEach(async () => {
    await testDynamoGateway.deleteAll(dynamoConfig.AUDIT_LOG_TABLE_NAME, "messageId")
  })

  it("should get all errors, paginating where necessary", async () => {
    const count = 12
    await createMockErrors(count)
    await createMockAuditLogs(1)
    const errors = await getAllErrors(apiClient)
    expect(errors).toHaveLength(count)
  })
})
