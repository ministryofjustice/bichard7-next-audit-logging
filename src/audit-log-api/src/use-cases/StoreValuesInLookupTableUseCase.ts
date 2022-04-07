import type { AuditLogEvent, AuditLogLookupDynamoGateway, KeyValuePair, PromiseResult } from "shared-types"
import { AuditLogLookup, isError } from "shared-types"

const maxAttributeValueLength = 1000

export default class StoreValuesInLookupTableUseCase {
  constructor(private readonly lookupGateway: AuditLogLookupDynamoGateway) {}

  async execute(event: AuditLogEvent, messageId: string): PromiseResult<AuditLogEvent> {
    const attributes: KeyValuePair<string, unknown> = {}

    const attributeKeys = Object.keys(event.attributes)

    for (const attributeKey of attributeKeys) {
      const attributeValue = event.attributes[attributeKey]
      if (attributeValue && typeof attributeValue === "string" && attributeValue.length > maxAttributeValueLength) {
        const lookupItem = await this.lookupGateway.create(new AuditLogLookup(attributeValue, messageId))

        if (isError(lookupItem)) {
          return lookupItem
        }

        attributes[attributeKey] = { valueLookup: lookupItem.id }
      } else {
        attributes[attributeKey] = attributeValue
      }
    }

    return {
      ...event,
      attributes
    } as AuditLogEvent
  }
}
