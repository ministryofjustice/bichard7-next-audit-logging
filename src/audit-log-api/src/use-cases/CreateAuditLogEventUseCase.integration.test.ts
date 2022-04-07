jest.retryTimes(10)
import type { AuditLogLookup, DynamoDbConfig } from "shared-types"
import { AuditLog, AuditLogEvent } from "shared-types"
import { AwsAuditLogDynamoGateway } from "shared"
import { TestDynamoGateway } from "shared"
import CreateAuditLogEventUseCase from "./CreateAuditLogEventUseCase"
import { AwsAuditLogLookupDynamoGateway } from "shared"
import StoreValuesInLookupTableUseCase from "./StoreValuesInLookupTableUseCase"
import type { KeyValuePair } from "shared-types"

const auditLogConfig: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:8000",
  DYNAMO_REGION: "eu-west-2",
  TABLE_NAME: "auditLogTable",
  AWS_ACCESS_KEY_ID: "DUMMY",
  AWS_SECRET_ACCESS_KEY: "DUMMY"
}

const auditLogLookupConfig: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:8000",
  DYNAMO_REGION: "eu-west-2",
  TABLE_NAME: "auditLogLookupTable",
  AWS_ACCESS_KEY_ID: "DUMMY",
  AWS_SECRET_ACCESS_KEY: "DUMMY"
}

const testAuditLogDynamoGateway = new TestDynamoGateway(auditLogConfig)
const testAuditLogLookupDynamoGateway = new TestDynamoGateway(auditLogLookupConfig)
const auditLogDynamoGateway = new AwsAuditLogDynamoGateway(auditLogConfig, auditLogConfig.TABLE_NAME)
const auditLogLookupDynamoGateway = new AwsAuditLogLookupDynamoGateway(
  auditLogLookupConfig,
  auditLogLookupConfig.TABLE_NAME
)
const storeValuesInLookupTableUseCase = new StoreValuesInLookupTableUseCase(auditLogLookupDynamoGateway)
const createAuditLogEventUseCase = new CreateAuditLogEventUseCase(
  auditLogDynamoGateway,
  storeValuesInLookupTableUseCase
)

const createAuditLog = (): AuditLog => new AuditLog("CorrelationId", new Date(), "Dummy hash")
const createAuditLogEvent = (): AuditLogEvent =>
  new AuditLogEvent({
    category: "information",
    timestamp: new Date(),
    eventType: "Create audit log event test",
    eventSource: "Integration Test"
  })
const createStacktraceAuditLogEvent = (): AuditLogEvent => {
  const event = new AuditLogEvent({
    eventSource: "CourtResultBean",
    eventType: "Message Rejected by [CourtResultBean] MDB",
    category: "error",
    timestamp: new Date()
  })
  event.addAttribute("Exception Message", "The XML Converter encountered an Error during message UnMarshalling")
  event.addAttribute(
    "Exception Stack Trace",
    "uk.gov.ocjr.mtu.br7.ho.pub.choreography.exception.MessageParsingException: The XML Converter encountered an Error during message UnMarshalling\n\tat uk.gov.ocjr.mtu.br7.ho.pub.choreography.CourtResultBean.extractGenericHearingOutcome(Unknown Source)"
  )
  return event
}

const getAuditLog = (messageId: string): Promise<AuditLog | null> =>
  testAuditLogDynamoGateway.getOne(auditLogConfig.TABLE_NAME, "messageId", messageId)

const lookupValue = (lookupId: string): Promise<AuditLogLookup | null> =>
  testAuditLogLookupDynamoGateway.getOne(auditLogLookupConfig.TABLE_NAME, "id", lookupId)

describe("CreateAuditLogUseCase", () => {
  beforeEach(async () => {
    await testAuditLogDynamoGateway.deleteAll(auditLogConfig.TABLE_NAME, "messageId")
    await testAuditLogLookupDynamoGateway.deleteAll(auditLogLookupConfig.TABLE_NAME, "id")
  })

  it("should return success result when event is added to the audit log", async () => {
    const auditLog = createAuditLog()
    await auditLogDynamoGateway.create(auditLog)

    const event = createAuditLogEvent()
    const result = await createAuditLogEventUseCase.create(auditLog.messageId, event)

    expect(result.resultType).toBe("success")

    const actualAuditLog = await getAuditLog(auditLog.messageId)
    expect(actualAuditLog).toBeDefined()
    expect(actualAuditLog?.events).toBeDefined()
    expect(actualAuditLog?.events).toHaveLength(1)

    const actualEvent = actualAuditLog?.events[0]
    expect(actualEvent?.category).toBe(event.category)
    expect(actualEvent?.timestamp).toBe(event.timestamp)
    expect(actualEvent?.eventType).toBe(event.eventType)
    expect(actualEvent?.eventSource).toBe(event.eventSource)
  })

  it("should store long attribute values in lookup table", async () => {
    const auditLog = createAuditLog()
    await auditLogDynamoGateway.create(auditLog)

    const event = createAuditLogEvent()
    event.addAttribute("attribute1", "test".repeat(500))
    const result = await createAuditLogEventUseCase.create(auditLog.messageId, event)

    expect(result.resultType).toBe("success")

    const actualAuditLog = await getAuditLog(auditLog.messageId)
    expect(actualAuditLog).toBeDefined()
    expect(actualAuditLog?.events).toBeDefined()
    expect(actualAuditLog?.events).toHaveLength(1)

    const actualEvent = actualAuditLog!.events[0]
    expect(actualEvent.category).toBe(event.category)
    expect(actualEvent.timestamp).toBe(event.timestamp)
    expect(actualEvent.eventType).toBe(event.eventType)
    expect(actualEvent.eventSource).toBe(event.eventSource)
    expect(actualEvent.attributes).toBeDefined()

    const { attribute1 } = actualEvent.attributes
    expect(attribute1).toBeDefined()
    expect(typeof attribute1).toBe("object")

    const { valueLookup } = attribute1 as KeyValuePair<string, string>
    expect(valueLookup).toBeDefined()

    const lookupResult = await lookupValue(valueLookup)
    expect(lookupResult).toBeDefined()

    const { value: attributeValue } = lookupResult as AuditLogLookup
    expect(attributeValue).toBe(event.attributes.attribute1)
  })

  it("should return not found result when audit log does not exist", async () => {
    const nonExistentMessageId = "11290b62-e8b8-47a8-ab24-6702a8fc6bba"
    const event = createAuditLogEvent()
    const result = await createAuditLogEventUseCase.create(nonExistentMessageId, event)

    expect(result.resultType).toBe("notFound")
  })

  it("should deduplicate stacktrace logs", async () => {
    const auditLog = createAuditLog()
    await auditLogDynamoGateway.create(auditLog)

    const event1 = createStacktraceAuditLogEvent()
    const result1 = await createAuditLogEventUseCase.create(auditLog.messageId, event1)

    expect(result1.resultType).toBe("success")

    const event2 = createStacktraceAuditLogEvent()
    const result2 = await createAuditLogEventUseCase.create(auditLog.messageId, event2)

    expect(result2.resultType).toBe("success")

    const actualAuditLog = await getAuditLog(auditLog.messageId)
    expect(actualAuditLog).toBeDefined()
    expect(actualAuditLog?.events).toBeDefined()
    expect(actualAuditLog?.events).toHaveLength(1)

    const actualEvent = actualAuditLog?.events[0]
    expect(actualEvent?.category).toBe(event1.category)
    expect(actualEvent?.timestamp).toBe(event1.timestamp)
    expect(actualEvent?.eventType).toBe(event1.eventType)
    expect(actualEvent?.eventSource).toBe(event1.eventSource)
  })

  it("should only deduplicate stacktrace logs if they are sequential", async () => {
    const auditLog = createAuditLog()
    await auditLogDynamoGateway.create(auditLog)

    const event1 = createStacktraceAuditLogEvent()
    const result1 = await createAuditLogEventUseCase.create(auditLog.messageId, event1)

    expect(result1.resultType).toBe("success")

    const event2 = createAuditLogEvent()
    const result2 = await createAuditLogEventUseCase.create(auditLog.messageId, event2)

    expect(result2.resultType).toBe("success")

    const event3 = createStacktraceAuditLogEvent()
    const result3 = await createAuditLogEventUseCase.create(auditLog.messageId, event3)

    expect(result3.resultType).toBe("success")

    const actualAuditLog = await getAuditLog(auditLog.messageId)
    expect(actualAuditLog).toBeDefined()
    expect(actualAuditLog?.events).toBeDefined()
    expect(actualAuditLog?.events).toHaveLength(3)
  })

  it("should not deduplicate non-stacktrace logs", async () => {
    const auditLog = createAuditLog()
    await auditLogDynamoGateway.create(auditLog)

    const event1 = createAuditLogEvent()
    const result1 = await createAuditLogEventUseCase.create(auditLog.messageId, event1)

    expect(result1.resultType).toBe("success")

    const event2 = createAuditLogEvent()
    const result2 = await createAuditLogEventUseCase.create(auditLog.messageId, event2)

    expect(result2.resultType).toBe("success")

    const actualAuditLog = await getAuditLog(auditLog.messageId)
    expect(actualAuditLog).toBeDefined()
    expect(actualAuditLog?.events).toBeDefined()
    expect(actualAuditLog?.events).toHaveLength(2)
  })
})
