/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
import type { AuditLogLookup, AuditLogLookupDynamoGateway, PromiseResult } from "shared-types"

export default class FakeAuditLogLookupDynamoGateway implements AuditLogLookupDynamoGateway {
  public items: AuditLogLookup[] = []

  private error?: Error

  create(lookupItem: AuditLogLookup): PromiseResult<AuditLogLookup> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    if (this.items.find((x) => x.id === lookupItem.id)) {
      return Promise.resolve(new Error("Lookup ID already exists."))
    }

    this.items.push(lookupItem)
    return Promise.resolve(lookupItem)
  }

  fetchById(lookupId: string): PromiseResult<AuditLogLookup> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    const lookupItem = this.items.find((x) => x.id === lookupId)

    if (!lookupItem) {
      return Promise.resolve(new Error("Lookup ID not found."))
    }

    return Promise.resolve(lookupItem)
  }

  shouldReturnError(error: Error): void {
    this.error = error
  }

  reset(items?: AuditLogLookup[]): void {
    this.error = undefined
    this.items = items ?? []
  }
}