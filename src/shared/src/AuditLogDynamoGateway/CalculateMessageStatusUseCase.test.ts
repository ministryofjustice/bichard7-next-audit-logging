import type { AuditLogEvent, KeyValuePair } from "shared-types"
import { AuditLogStatus, EventType } from "shared-types"
import CalculateMessageStatusUseCase from "./CalculateMessageStatusUseCase"

let eventIndex = 0
const createEvent = (eventType: string, category = "information", attributes?: KeyValuePair<string, string>) =>
  ({
    eventType,
    category,
    attributes,
    timestamp: new Date(new Date().getTime() + 1000 * eventIndex++)
  } as unknown as AuditLogEvent)
const sanitisedEvent = () => createEvent(EventType.SanitisedMessage)
const archivedRecordEvent = () => createEvent(EventType.ErrorRecordArchival)
const errorEvent = () => createEvent("Dummy error event", "error")
const retryingEvent = () => createEvent(EventType.Retrying)
const pncUpdatedEvent = () => createEvent(EventType.PncUpdated)
const recordIgnoredNoRecordableOffencesEvent = () => createEvent(EventType.RecordIgnoredNoRecordableOffences)
const recordIgnoredNoOffencesEvent = () => createEvent(EventType.RecordIgnoredNoOffences)
const prePNCUpdateTriggersGeneratedEvent = () =>
  createEvent(EventType.TriggersGenerated, "information", {
    "Trigger 1 Details": "TRPR0004",
    "Trigger 2 Details": "TRPR0004",
    "Trigger 3 Details": "TRPR0006"
  })
const postPNCUpdateTriggersGeneratedEvent = () =>
  createEvent(EventType.TriggersGenerated, "information", { "Trigger 1 Details": "TRPS0003" })
const triggerInstancesResolvedEvent = () =>
  createEvent(EventType.TriggerInstancesResolved, "information", {
    "Trigger Code 01": "TRPR0004",
    "Trigger Code 02": "TRPR0004",
    "Trigger Code 03": "TRPR0006",
    "Trigger Code 04": "TRPS0003"
  })
const triggerInstancesPartiallyResolvedEvent = () =>
  createEvent(EventType.TriggerInstancesResolved, "information", {
    "Trigger Code 01": "TRPR0004",
    "Trigger Code 02": "TRPR0004"
  })
const exceptionsManuallyResolvedEvent = () => createEvent(EventType.ExceptionsManuallyResolved)

describe("CalculateMessageStatusUseCase", () => {
  it("should not affect the status calculation when message has sanitised event", () => {
    const status = new CalculateMessageStatusUseCase(errorEvent(), sanitisedEvent(), archivedRecordEvent()).call()

    expect(status).toBe(AuditLogStatus.error)
  })

  it("should not affect the status calculation when message has error record archival event", () => {
    const status = new CalculateMessageStatusUseCase(errorEvent(), archivedRecordEvent()).call()

    expect(status).toBe(AuditLogStatus.error)
  })

  it("should return Completed status when there are no exceptions and triggers, and PNC is updated", () => {
    const status = new CalculateMessageStatusUseCase(pncUpdatedEvent()).call()

    expect(status).toBe(AuditLogStatus.completed)
  })

  it("should return Completed status when there are no exceptions and triggers, and record is ignored (no offences)", () => {
    const status = new CalculateMessageStatusUseCase(recordIgnoredNoOffencesEvent()).call()

    expect(status).toBe(AuditLogStatus.completed)
  })

  it("should return Completed status when there are no exceptions and triggers, and record is ignored (no recordable offences)", () => {
    const status = new CalculateMessageStatusUseCase(recordIgnoredNoRecordableOffencesEvent()).call()

    expect(status).toBe(AuditLogStatus.completed)
  })

  it("should return Completed status when there are no exceptions, triggers are resolved, and PNC is updated", () => {
    const status = new CalculateMessageStatusUseCase(
      prePNCUpdateTriggersGeneratedEvent(),
      postPNCUpdateTriggersGeneratedEvent(),
      triggerInstancesResolvedEvent(),
      pncUpdatedEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.completed)
  })

  it("should return Completed status when there are no exceptions, triggers are resolved, and record is ignored", () => {
    const status = new CalculateMessageStatusUseCase(
      prePNCUpdateTriggersGeneratedEvent(),
      postPNCUpdateTriggersGeneratedEvent(),
      triggerInstancesResolvedEvent(),
      recordIgnoredNoRecordableOffencesEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.completed)
  })

  it("should return Completed status when exceptions are resolved and resubmitted, there are no triggers, and record is ignored", () => {
    const status = new CalculateMessageStatusUseCase(recordIgnoredNoRecordableOffencesEvent()).call()

    expect(status).toBe(AuditLogStatus.completed)
  })

  it("should return Completed status when exceptions are resolved and resubmitted, there are no triggers, and PNC is updated", () => {
    const status = new CalculateMessageStatusUseCase(pncUpdatedEvent()).call()

    expect(status).toBe(AuditLogStatus.completed)
  })

  it("should return Completed status when exceptions are manually resolved, there are no triggers, and record is ignored", () => {
    const status = new CalculateMessageStatusUseCase(
      exceptionsManuallyResolvedEvent(),
      recordIgnoredNoRecordableOffencesEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.completed)
  })

  it("should return Completed status when exceptions are manually resolved, there are no triggers, and PNC is updated", () => {
    const status = new CalculateMessageStatusUseCase(exceptionsManuallyResolvedEvent(), pncUpdatedEvent()).call()

    expect(status).toBe(AuditLogStatus.completed)
  })

  it("should return Completed status when exceptions are resolved and resubmitted, triggers are resolved, and record is ignored", () => {
    const status = new CalculateMessageStatusUseCase(
      prePNCUpdateTriggersGeneratedEvent(),
      postPNCUpdateTriggersGeneratedEvent(),
      triggerInstancesResolvedEvent(),
      recordIgnoredNoRecordableOffencesEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.completed)
  })

  it("should return Completed status when exceptions are resolved and resubmitted, triggers are resolved, and PNC is updated", () => {
    const status = new CalculateMessageStatusUseCase(
      prePNCUpdateTriggersGeneratedEvent(),
      postPNCUpdateTriggersGeneratedEvent(),
      triggerInstancesResolvedEvent(),
      pncUpdatedEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.completed)
  })

  it("should return Completed status when exceptions are manually resolved, triggers are resolved, and record is ignored", () => {
    const status = new CalculateMessageStatusUseCase(
      exceptionsManuallyResolvedEvent(),
      prePNCUpdateTriggersGeneratedEvent(),
      postPNCUpdateTriggersGeneratedEvent(),
      triggerInstancesResolvedEvent(),
      recordIgnoredNoRecordableOffencesEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.completed)
  })

  it("should return Completed status when exceptions are manually resolved, triggers are resolved, and PNC is updated", () => {
    const status = new CalculateMessageStatusUseCase(
      exceptionsManuallyResolvedEvent(),
      prePNCUpdateTriggersGeneratedEvent(),
      postPNCUpdateTriggersGeneratedEvent(),
      triggerInstancesResolvedEvent(),
      pncUpdatedEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.completed)
  })

  it("should return Retrying status when last event type is retrying", () => {
    const status = new CalculateMessageStatusUseCase(
      prePNCUpdateTriggersGeneratedEvent(),
      errorEvent(),
      retryingEvent(),
      errorEvent(),
      retryingEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.retrying)
  })

  it("should return Error status when there is an event with category Error", () => {
    const status = new CalculateMessageStatusUseCase(
      prePNCUpdateTriggersGeneratedEvent(),
      errorEvent(),
      retryingEvent(),
      errorEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.error)
  })

  it("should return Processing status when triggers are not resolved", () => {
    const status = new CalculateMessageStatusUseCase(prePNCUpdateTriggersGeneratedEvent()).call()

    expect(status).toBe(AuditLogStatus.processing)
  })

  it("should return Processing status when triggers are partially resolved", () => {
    const status = new CalculateMessageStatusUseCase(
      prePNCUpdateTriggersGeneratedEvent(),
      postPNCUpdateTriggersGeneratedEvent(),
      triggerInstancesPartiallyResolvedEvent(),
      recordIgnoredNoRecordableOffencesEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.processing)
  })

  it("should return Processing status when exceptions are not resolved", () => {
    const status = new CalculateMessageStatusUseCase(
      prePNCUpdateTriggersGeneratedEvent(),
      triggerInstancesResolvedEvent(),
      recordIgnoredNoRecordableOffencesEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.processing)
  })

  it("should return Processing status when there are no PNC updated or record ignored events", () => {
    const status = new CalculateMessageStatusUseCase(
      prePNCUpdateTriggersGeneratedEvent(),
      triggerInstancesResolvedEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.processing)
  })
})
