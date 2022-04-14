jest.setTimeout(15000)

import type { DynamoDbConfig, S3Config } from "shared-types"
import { AuditLogEvent, AuditLogLookup, BichardAuditLogEvent } from "shared-types"
import { AuditLog } from "shared-types"
import { HttpStatusCode, TestAwsS3Gateway, TestDynamoGateway } from "shared"
import axios from "axios"

const dynamoConfig: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:8000",
  DYNAMO_REGION: "eu-west-2",
  TABLE_NAME: "",
  AWS_ACCESS_KEY_ID: "DUMMY",
  AWS_SECRET_ACCESS_KEY: "DUMMY"
}

const auditLogTableName = "auditLogTable"
const auditLogLookupTableName = "auditLogLookupTable"

const s3Config: S3Config = {
  url: "http://localhost:4569",
  region: "eu-west-2",
  bucketName: "auditLogEventsBucket",
  accessKeyId: "S3RVER",
  secretAccessKey: "S3RVER"
}

const s3Gateway = new TestAwsS3Gateway(s3Config)
const testDynamoGateway = new TestDynamoGateway(dynamoConfig)

const createBichardAuditLogEvent = (eventS3Path: string) => {
  const event = new BichardAuditLogEvent({
    s3Path: eventS3Path,
    eventSourceArn: "dummy event source arn",
    eventSourceQueueName: "dummy event source queue name",
    eventSource: "dummy event source",
    category: "information",
    eventType: "Hearing Outcome marked as resolved by user",
    timestamp: new Date()
  })
  event.addAttribute("Trigger 2 Details", "TRPR0004")
  event.addAttribute("Original Hearing Outcome / PNC Update Dataset", "<?xml><dummy></dummy>")
  event.addAttribute("OriginalHearingOutcome", "<?xml><dummy></dummy>")
  event.addAttribute("OriginalPNCUpdateDataset", "<?xml><dummy></dummy>")
  event.addAttribute("PNCUpdateDataset", "<?xml><dummy></dummy>")
  event.addAttribute("AmendedHearingOutcome", "<?xml><dummy></dummy>")
  event.addAttribute("AmendedPNCUpdateDataset", "<?xml><dummy></dummy>")

  return event
}

describe("sanitiseMessage", () => {
  beforeEach(async () => {
    await s3Gateway.deleteAll()
    await testDynamoGateway.deleteAll(auditLogTableName, "messageId")
    await testDynamoGateway.deleteAll(auditLogLookupTableName, "id")
  })

  it("should return Ok status when message has been sanitised successfully", async () => {
    const message = new AuditLog("External Correlation ID", new Date(), "Dummy hash")
    message.s3Path = "message.xml"
    const event1 = createBichardAuditLogEvent("event1.xml")
    const event2 = new AuditLogEvent({
      eventSource: "dummy event source",
      category: "information",
      eventType: "dummy event type",
      timestamp: new Date()
    })
    message.events = [event1, event2]

    await Promise.all([message.s3Path, event1.s3Path].map((s3Path) => s3Gateway.upload(s3Path, "dummy")))

    await testDynamoGateway.insertOne(auditLogTableName, message, "messageId")

    await Promise.all(
      [...Array(2).keys()].map((index) => {
        const item = new AuditLogLookup(`Record to delete ${index}`, message.messageId)
        return testDynamoGateway.insertOne(auditLogLookupTableName, { ...item, id: `ID-${index}` }, "id")
      })
    )

    const response = await axios.post(`http://localhost:3010/messages/${message.messageId}/sanitise`, null, {
      validateStatus: undefined
    })

    expect(response.status).toBe(HttpStatusCode.noContent)
    expect(await s3Gateway.getAll()).toEqual([])

    const actualMessage = await testDynamoGateway.getOne<AuditLog>(auditLogTableName, "messageId", message.messageId)

    const attributes = actualMessage?.events.find((event) => "s3Path" in event)?.attributes ?? {}
    expect(Object.keys(attributes)).toHaveLength(1)
    expect(attributes["Trigger 2 Details"]).toBe("TRPR0004")

    const lookupItems = await testDynamoGateway.getAll(auditLogLookupTableName)
    expect(lookupItems.Items).toHaveLength(0)
  })

  it("should return Error when the message ID does not exist", async () => {
    const response = await axios.post(`http://localhost:3010/messages/IdNotExist/sanitise`, null, {
      validateStatus: undefined
    })

    expect(response.status).toBe(HttpStatusCode.notFound)
  })
})
