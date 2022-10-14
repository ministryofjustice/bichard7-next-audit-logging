import type { AuditLogEvent } from "shared-types"
import { AuditLogStatus, EventType, EventTypeV2 } from "shared-types"

export default class CalculateMessageStatusUseCase {
  private readonly events: AuditLogEvent[] = []

  constructor(...allEvents: (AuditLogEvent[] | AuditLogEvent)[]) {
    this.events = allEvents
      .flatMap((events: AuditLogEvent[] | AuditLogEvent) => (Array.isArray(events) ? events : [events]))
      .sort((eventA, eventB) => (eventA.timestamp > eventB.timestamp ? 1 : -1))
  }

  call(): string {
    if (
      (this.hasNoTriggers || this.triggersAreResolved) &&
      (this.exceptionsAreManuallyResolved || this.pncIsUpdated || this.recordIsIgnored)
    ) {
      return AuditLogStatus.completed
    } else if (this.isRetrying) {
      return AuditLogStatus.retrying
    } else if (this.hasErrorEvent) {
      return AuditLogStatus.error
    }

    return AuditLogStatus.processing
  }

  private hasEventType(eventType: EventType | EventTypeV2): boolean {
    return !!this.events.find((event) => event.eventType === eventType)
  }

  private get hasNoTriggers(): boolean {
    return !this.hasEventType(EventType.TriggersGenerated) && !this.hasEventType(EventTypeV2.TriggersGenerated)
  }

  private get triggersAreResolved(): boolean {
    const triggersGeneratedEvents = this.events.filter(
      (event) => event.eventType === EventType.TriggersGenerated || event.eventType === EventTypeV2.TriggersGenerated
    )
    if (triggersGeneratedEvents.length === 0) {
      return false
    }

    const triggerResolvedEvents = this.events.filter((event) => event.eventType === EventType.TriggerInstancesResolved)
    if (!triggerResolvedEvents) {
      return false
    }

    const generatedTriggers = triggersGeneratedEvents.flatMap((event) =>
      Object.keys(event.attributes ?? {})
        .filter((key) => /Trigger.*Details/i.test(key))
        .map((key) => event.attributes[key])
    )

    const resolvedTriggers = triggerResolvedEvents.flatMap((event) =>
      Object.keys(event.attributes ?? {})
        .filter((key) => /Trigger Code.*/i.test(key))
        .map((key) => event.attributes[key])
    )

    return (
      generatedTriggers.length === resolvedTriggers.length &&
      !generatedTriggers.some((generatedTrigger) => !resolvedTriggers.includes(generatedTrigger))
    )
  }

  private get exceptionsAreManuallyResolved(): boolean {
    return this.hasEventType(EventType.ExceptionsManuallyResolved)
  }

  private get pncIsUpdated(): boolean {
    return this.hasEventType(EventType.PncUpdated)
  }

  private get recordIsIgnored(): boolean {
    return (
      this.hasEventType(EventType.InterimHearingWithAncillaryOnlyCourtResults_PncNotUpdated) ||
      this.hasEventType(EventTypeV2.HearingOutcomeIgnoredCourtDisabled) ||
      this.hasEventType(EventTypeV2.HearingOutcomeIgnoredAppeal) ||
      this.hasEventType(EventType.StatutoryDeclarationCaseIgnored) ||
      this.hasEventType(EventType.RecordIgnoredNoOffences) ||
      this.hasEventType(EventType.RecordIgnoredNoRecordableOffences)
    )
  }

  private get isRetrying(): boolean {
    return this.events[this.events.length - 1]?.eventType === EventType.Retrying
  }

  private get hasErrorEvent(): boolean {
    const errorEvent = this.events.filter((event) => event.category === "error").slice(-1)[0]
    const retryingEvent = this.events.filter((event) => event.eventType === EventType.Retrying).slice(-1)[0]
    const otherEvent = this.events
      .filter(
        (event) =>
          event.eventType === EventType.PncUpdated ||
          event.eventType.includes("added to Error List") ||
          event.eventType.includes("passed to Error List") ||
          event.eventType === EventType.RecordIgnoredNoRecordableOffences ||
          event.eventType === EventType.TriggerInstancesResolved ||
          event.eventType === EventType.TriggersGenerated
      )
      .slice(-1)[0]

    return (
      errorEvent &&
      (!retryingEvent || errorEvent.timestamp > retryingEvent.timestamp) &&
      (!otherEvent || errorEvent.timestamp > otherEvent.timestamp) &&
      (errorEvent.eventType !== EventType.FailedToUpdatePnc || !this.pncIsUpdated)
    )
  }
}
