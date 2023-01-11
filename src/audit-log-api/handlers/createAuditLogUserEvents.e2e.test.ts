import axios from "axios"
import { HttpStatusCode } from "src/shared"
import { mockApiAuditLogEvent } from "src/shared/testing"
import { TestDynamoGateway, auditLogDynamoConfig } from "../test"

const testGateway = new TestDynamoGateway(auditLogDynamoConfig)

describe("Create audit log user events", () => {
  beforeEach(async () => {
    await testGateway.deleteAll(auditLogDynamoConfig.eventsTableName, "_id")
  })
  it("should create one audit log user event", async () => {
    const events = mockApiAuditLogEvent({ eventType: `Test event 1` })
    const result = await axios.post(`http://localhost:3010/users/dummy-user/events`, events)
    expect(result.status).toEqual(HttpStatusCode.created)

    const actualEvents = await testGateway.getAll(auditLogDynamoConfig.eventsTableName)

    expect(actualEvents.Items).toHaveLength(1)
  })

  it("should create multiple audit log user events", async () => {
    const events = new Array(10).fill(0).map((_, index) => mockApiAuditLogEvent({ eventType: `Test event ${index}` }))
    const result = await axios.post(`http://localhost:3010/users/dummy-user/events`, events)
    expect(result.status).toEqual(HttpStatusCode.created)

    const actualEvents = await testGateway.getAll(auditLogDynamoConfig.eventsTableName)

    expect(actualEvents.Items).toHaveLength(10)
  })
})
