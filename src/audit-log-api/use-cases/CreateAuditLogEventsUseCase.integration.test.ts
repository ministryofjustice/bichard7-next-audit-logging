import { AuditLog, AuditLogEvent } from "src/shared/types"
import { AuditLogDynamoGateway } from "../gateways/dynamo"
import { auditLogDynamoConfig, TestDynamoGateway } from "../test"
import { CreateAuditLogEventsUseCase } from "./CreateAuditLogEventsUseCase"

const testAuditLogDynamoGateway = new TestDynamoGateway(auditLogDynamoConfig)
const auditLogDynamoGateway = new AuditLogDynamoGateway(auditLogDynamoConfig)
const createAuditLogEventsUseCase = new CreateAuditLogEventsUseCase(auditLogDynamoGateway)

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

const getAuditLog = async (messageId: string): Promise<AuditLog | undefined> =>
  (await auditLogDynamoGateway.fetchOne(messageId)) as AuditLog

describe("CreateAuditLogEventsUseCase", () => {
  beforeEach(async () => {
    await testAuditLogDynamoGateway.deleteAll(auditLogDynamoConfig.auditLogTableName, "messageId")
    jest.clearAllMocks()
  })

  it("should return success result when event is added to the audit log", async () => {
    const auditLog = createAuditLog()
    await auditLogDynamoGateway.create(auditLog)

    const event = createAuditLogEvent()
    const result = await createAuditLogEventsUseCase.create(auditLog.messageId, [event])

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

  it("should return not found result when audit log does not exist", async () => {
    const nonExistentMessageId = "11290b62-e8b8-47a8-ab24-6702a8fc6bba"
    const event = createAuditLogEvent()
    const result = await createAuditLogEventsUseCase.create(nonExistentMessageId, [event])

    expect(result.resultType).toBe("notFound")
  })

  it("should deduplicate stacktrace logs added separately", async () => {
    const auditLog = createAuditLog()
    await auditLogDynamoGateway.create(auditLog)

    const event1 = createStacktraceAuditLogEvent()
    const result1 = await createAuditLogEventsUseCase.create(auditLog.messageId, [event1])

    expect(result1.resultType).toBe("success")

    const event2 = createStacktraceAuditLogEvent()
    const result2 = await createAuditLogEventsUseCase.create(auditLog.messageId, [event2])

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

  it("should deduplicate stacktrace logs in multiple operations", async () => {
    const auditLog = createAuditLog()
    await auditLogDynamoGateway.create(auditLog)

    const event1 = createStacktraceAuditLogEvent()
    const result1 = await createAuditLogEventsUseCase.create(auditLog.messageId, event1)

    expect(result1.resultType).toBe("success")

    const event2 = createStacktraceAuditLogEvent()
    const result2 = await createAuditLogEventsUseCase.create(auditLog.messageId, event2)

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

  it("should deduplicate stacktrace logs in the same operation", async () => {
    const auditLog = createAuditLog()
    await auditLogDynamoGateway.create(auditLog)

    const event1 = createStacktraceAuditLogEvent()
    const event2 = createStacktraceAuditLogEvent()
    const result = await createAuditLogEventsUseCase.create(auditLog.messageId, [event1, event2])

    expect(result.resultType).toBe("success")

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

  it("should not deduplicate stacktrace logs if they are not sequential in multiple operations", async () => {
    const auditLog = createAuditLog()
    await auditLogDynamoGateway.create(auditLog)

    const event1 = createStacktraceAuditLogEvent()
    const result1 = await createAuditLogEventsUseCase.create(auditLog.messageId, event1)

    expect(result1.resultType).toBe("success")

    const event2 = createAuditLogEvent()
    const result2 = await createAuditLogEventsUseCase.create(auditLog.messageId, event2)

    expect(result2.resultType).toBe("success")

    const event3 = createStacktraceAuditLogEvent()
    const result3 = await createAuditLogEventsUseCase.create(auditLog.messageId, event3)

    expect(result3.resultType).toBe("success")

    const actualAuditLog = await getAuditLog(auditLog.messageId)
    expect(actualAuditLog).toBeDefined()
    expect(actualAuditLog?.events).toBeDefined()
    expect(actualAuditLog?.events).toHaveLength(3)
  })

  it("should not deduplicate stacktrace logs if they are not sequential in a single operation", async () => {
    const auditLog = createAuditLog()
    await auditLogDynamoGateway.create(auditLog)

    const event1 = createStacktraceAuditLogEvent()
    const event2 = createAuditLogEvent()
    const event3 = createStacktraceAuditLogEvent()
    const result = await createAuditLogEventsUseCase.create(auditLog.messageId, [event1, event2, event3])

    expect(result.resultType).toBe("success")

    const actualAuditLog = await getAuditLog(auditLog.messageId)
    expect(actualAuditLog).toBeDefined()
    expect(actualAuditLog?.events).toBeDefined()
    expect(actualAuditLog?.events).toHaveLength(3)
  })

  it("should not deduplicate non-stacktrace logs", async () => {
    const auditLog = createAuditLog()
    await auditLogDynamoGateway.create(auditLog)

    const event1 = createAuditLogEvent()
    const event2 = createAuditLogEvent()
    const result2 = await createAuditLogEventsUseCase.create(auditLog.messageId, [event1, event2])
    console.log(result2)

    expect(result2.resultType).toBe("success")

    const actualAuditLog = await getAuditLog(auditLog.messageId)
    expect(actualAuditLog).toBeDefined()
    expect(actualAuditLog?.events).toBeDefined()
    expect(actualAuditLog?.events).toHaveLength(2)
  })

  it("shouldn't add events when creating the transaction fails", async () => {
    const auditLog = createAuditLog()
    await auditLogDynamoGateway.create(auditLog)

    const event = createAuditLogEvent()
    event.addAttribute("reallyLongAttribute", "X".repeat(10_000))

    jest
      .spyOn(auditLogDynamoGateway, "executeTransaction")
      .mockResolvedValueOnce(new Error("Failed to create audit log table entry"))

    const result = await createAuditLogEventsUseCase.create(auditLog.messageId, [event])

    expect(result.resultType).toBe("transactionFailed")

    const actualAuditLog = await getAuditLog(auditLog.messageId)
    expect(actualAuditLog).toBeDefined()
    expect(actualAuditLog?.events).toHaveLength(0)
  })

  it("should give an error when attempting to create more events than is supported by dynamodb transactions", async () => {
    const auditLog = createAuditLog()
    await auditLogDynamoGateway.create(auditLog)

    const events = new Array(250).fill(0).map(() => {
      const event = createAuditLogEvent()
      event.addAttribute("longAttribute", "this goes in the lookup table".repeat(100))
      return event
    })

    const result = await createAuditLogEventsUseCase.create(auditLog.messageId, events)
    expect(result.resultType).toBe("tooManyEvents")
  })
})
