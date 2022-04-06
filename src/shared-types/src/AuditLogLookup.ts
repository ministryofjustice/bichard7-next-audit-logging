import { v4 as uuid } from "uuid"

export default class AuditLogLookup {
  public readonly id: string

  constructor(public readonly value: string, public readonly externalCorrelationId: string) {
    this.id = uuid()
  }
}
