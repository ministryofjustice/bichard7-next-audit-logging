jest.setTimeout(15000)

import type { DynamoDbConfig, S3Config } from "shared-types"
import { AuditLog } from "shared-types"
import { HttpStatusCode, TestAwsS3Gateway, TestDynamoGateway } from "shared"
import axios from "axios"

const dynamoConfig: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:8000",
  DYNAMO_REGION: "eu-west-2",
  AUDIT_LOG_TABLE_NAME: "auditLogTable",
  AWS_ACCESS_KEY_ID: "DUMMY",
  AWS_SECRET_ACCESS_KEY: "DUMMY"
}

const s3Config: S3Config = {
  url: "http://localhost:4569",
  region: "eu-west-2",
  bucketName: "auditLogEventsBucket",
  accessKeyId: "S3RVER",
  secretAccessKey: "S3RVER"
}

const s3Gateway = new TestAwsS3Gateway(s3Config)
const testDynamoGateway = new TestDynamoGateway(dynamoConfig)

describe("sanitiseMessage", () => {
  beforeEach(async () => {
    await s3Gateway.deleteAll()
  })

  it("should return Ok status when message has been sanitised successfully", async () => {
    const dummyMessage = "dummy"

    const s3Path = "message.xml"
    await s3Gateway.upload(s3Path, dummyMessage)

    const message = new AuditLog("External Correlation ID", new Date(), "Dummy hash")
    message.s3Path = s3Path

    await testDynamoGateway.insertOne(dynamoConfig.AUDIT_LOG_TABLE_NAME, message, "messageId")

    const response = await axios.post(`http://localhost:3010/messages/${message.messageId}/sanitise`, null)

    expect(response.status).toBe(HttpStatusCode.noContent)
    expect(await s3Gateway.getAll()).toEqual([])
  })

  it("should return Error when the message ID does not exist", async () => {
    const response = await axios.post(`http://localhost:3010/messages/IdNotExist/sanitise`, null, {
      validateStatus: undefined
    })

    expect(response.status).toBe(HttpStatusCode.notFound)
  })
})
