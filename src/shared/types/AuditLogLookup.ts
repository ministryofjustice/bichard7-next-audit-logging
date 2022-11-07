import { v4 as uuid } from "uuid"

export default class AuditLogLookup {
  public readonly id: string

  public isCompressed?: boolean

  public expiryTime?: string

  constructor(public readonly value: string, public readonly messageId: string) {
    this.id = uuid()
  }
}
