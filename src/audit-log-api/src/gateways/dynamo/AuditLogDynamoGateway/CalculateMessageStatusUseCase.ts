import type { AuditLogEvent } from "shared-types"
import { AuditLogStatus, EventCode } from "shared-types"

export default class CalculateMessageStatusUseCase {
  private readonly events: AuditLogEvent[] = []

  constructor(...allEvents: (AuditLogEvent[] | AuditLogEvent)[]) {
    this.events = allEvents
      .flatMap((events: AuditLogEvent[] | AuditLogEvent) => (Array.isArray(events) ? events : [events]))
      .sort((eventA, eventB) => (eventA.timestamp > eventB.timestamp ? 1 : -1))
  }

  call(): AuditLogStatus {
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

  private hasEventCode(eventCode: EventCode): boolean {
    return !!this.events.find((event) => event.eventCode === eventCode)
  }

  private get hasNoTriggers(): boolean {
    return !this.hasEventCode(EventCode.TriggersGenerated)
  }

  private get triggersAreResolved(): boolean {
    const triggersGeneratedEvents = this.events.filter((event) => event.eventCode === EventCode.TriggersGenerated)
    if (triggersGeneratedEvents.length === 0) {
      return false
    }

    const triggerResolvedEvents = this.events.filter((event) => event.eventCode === EventCode.TriggersResolved)
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
    return this.hasEventCode(EventCode.ExceptionsResolved)
  }

  private get pncIsUpdated(): boolean {
    return this.hasEventCode(EventCode.PncUpdated)
  }

  private get recordIsIgnored(): boolean {
    return (
      this.hasEventCode(EventCode.IgnoredAncillary) ||
      this.hasEventCode(EventCode.IgnoredDisabled) ||
      this.hasEventCode(EventCode.IgnoredAppeal) ||
      this.hasEventCode(EventCode.IgnoredReopened) ||
      this.hasEventCode(EventCode.IgnoredNoOffences) ||
      this.hasEventCode(EventCode.IgnoredNonrecordable)
    )
  }

  private get isRetrying(): boolean {
    return this.events[this.events.length - 1]?.eventCode === EventCode.RetryingMessage
  }

  private get hasErrorEvent(): boolean {
    const errorEvent = this.events.filter((event) => event.category === "error").slice(-1)[0]
    const retryingEvent = this.events.filter((event) => event.eventCode === EventCode.RetryingMessage).slice(-1)[0]
    const otherEvent = this.events
      .filter(
        (event) =>
          event.eventCode === EventCode.PncUpdated ||
          event.eventCode === EventCode.ExceptionsGenerated ||
          event.eventCode === EventCode.IgnoredNonrecordable ||
          event.eventCode === EventCode.TriggersResolved ||
          event.eventCode === EventCode.TriggersGenerated
      )
      .slice(-1)[0]

    return (
      errorEvent &&
      (!retryingEvent || errorEvent.timestamp > retryingEvent.timestamp) &&
      (!otherEvent || errorEvent.timestamp > otherEvent.timestamp) &&
      (errorEvent.eventCode !== EventCode.MessageRejected || !this.pncIsUpdated)
    )
  }
}
