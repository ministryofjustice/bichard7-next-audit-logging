import type { AuditLogEvent, KeyValuePair } from "shared-types"
import { AuditLogStatus } from "shared-types"
import { EventType } from "shared-types"
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
const archivedRecordEvent = () => createEvent(EventType.RecordArchived)
const errorEvent = () => createEvent("Dummy error event", "error")
const retryingEvent = () => createEvent(EventType.Retrying)
const pncUpdatedEvent = () => createEvent(EventType.PncUpdated)
const recordIgnoredEvent = () => createEvent(EventType.RecordIgnored)
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
    "Trigger Code 02": "TRPR0006",
    "Trigger Code 03": "TRPS0003"
  })
const exceptionsGeneratedEvent = () => createEvent(EventType.ExceptionsGenerated)
const amendedAndResubmittedEvent = () => createEvent(EventType.AmendedAndResubmitted)
const exceptionsManuallyResolvedEvent = () => createEvent(EventType.ExceptionsManuallyResolved)

describe("CalculateMessageStatusUseCase", () => {
  it("should return Sanitised status when message has sanitised event", () => {
    const status = new CalculateMessageStatusUseCase(sanitisedEvent(), archivedRecordEvent()).call()

    expect(status).toBe(AuditLogStatus.sanitised)
  })

  it("should return Archived status when message has archived record event and not sanitised", () => {
    const status = new CalculateMessageStatusUseCase(archivedRecordEvent(), errorEvent()).call()

    expect(status).toBe(AuditLogStatus.archived)
  })

  it("should return Completed status when there are no exceptions and triggers, and PNC is updated", () => {
    const status = new CalculateMessageStatusUseCase(pncUpdatedEvent()).call()

    expect(status).toBe(AuditLogStatus.completed)
  })

  it("should return Completed status when there are no exceptions and triggers, and record is ignored", () => {
    const status = new CalculateMessageStatusUseCase(recordIgnoredEvent()).call()

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
      recordIgnoredEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.completed)
  })

  it("should return Completed status when exceptions are resolved and resubmitted, there are no triggers, and record is ignored", () => {
    const status = new CalculateMessageStatusUseCase(
      exceptionsGeneratedEvent(),
      amendedAndResubmittedEvent(),
      recordIgnoredEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.completed)
  })

  it("should return Completed status when exceptions are resolved and resubmitted, there are no triggers, and PNC is updated", () => {
    const status = new CalculateMessageStatusUseCase(
      exceptionsGeneratedEvent(),
      amendedAndResubmittedEvent(),
      pncUpdatedEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.completed)
  })

  it("should return Completed status when exceptions are manually resolved, there are no triggers, and record is ignored", () => {
    const status = new CalculateMessageStatusUseCase(
      exceptionsGeneratedEvent(),
      exceptionsManuallyResolvedEvent(),
      recordIgnoredEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.completed)
  })

  it("should return Completed status when exceptions are manually resolved, there are no triggers, and PNC is updated", () => {
    const status = new CalculateMessageStatusUseCase(
      exceptionsGeneratedEvent(),
      exceptionsManuallyResolvedEvent(),
      pncUpdatedEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.completed)
  })

  it("should return Completed status when exceptions are resolved and resubmitted, triggers are resolved, and record is ignored", () => {
    const status = new CalculateMessageStatusUseCase(
      exceptionsGeneratedEvent(),
      amendedAndResubmittedEvent(),
      prePNCUpdateTriggersGeneratedEvent(),
      postPNCUpdateTriggersGeneratedEvent(),
      triggerInstancesResolvedEvent(),
      recordIgnoredEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.completed)
  })

  it("should return Completed status when exceptions are resolved and resubmitted, triggers are resolved, and PNC is updated", () => {
    const status = new CalculateMessageStatusUseCase(
      exceptionsGeneratedEvent(),
      amendedAndResubmittedEvent(),
      prePNCUpdateTriggersGeneratedEvent(),
      postPNCUpdateTriggersGeneratedEvent(),
      triggerInstancesResolvedEvent(),
      pncUpdatedEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.completed)
  })

  it("should return Completed status when exceptions are manually resolved, triggers are resolved, and record is ignored", () => {
    const status = new CalculateMessageStatusUseCase(
      exceptionsGeneratedEvent(),
      exceptionsManuallyResolvedEvent(),
      prePNCUpdateTriggersGeneratedEvent(),
      postPNCUpdateTriggersGeneratedEvent(),
      triggerInstancesResolvedEvent(),
      recordIgnoredEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.completed)
  })

  it("should return Completed status when exceptions are manually resolved, triggers are resolved, and PNC is updated", () => {
    const status = new CalculateMessageStatusUseCase(
      exceptionsGeneratedEvent(),
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
    const status = new CalculateMessageStatusUseCase(
      exceptionsGeneratedEvent(),
      amendedAndResubmittedEvent(),
      prePNCUpdateTriggersGeneratedEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.processing)
  })

  it("should return Processing status when exceptions are not resolved", () => {
    const status = new CalculateMessageStatusUseCase(
      exceptionsGeneratedEvent(),
      prePNCUpdateTriggersGeneratedEvent(),
      triggerInstancesResolvedEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.processing)
  })

  it("should return Processing status when there are no PNC updated or record ignored events", () => {
    const status = new CalculateMessageStatusUseCase(
      exceptionsGeneratedEvent(),
      amendedAndResubmittedEvent(),
      prePNCUpdateTriggersGeneratedEvent(),
      triggerInstancesResolvedEvent()
    ).call()

    expect(status).toBe(AuditLogStatus.processing)
  })
})
