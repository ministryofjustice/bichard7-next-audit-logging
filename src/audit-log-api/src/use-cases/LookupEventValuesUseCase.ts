import type { AuditLogEvent, AuditLogLookupDynamoGateway, KeyValuePair, PromiseResult } from "shared-types"
import { isError } from "shared-types"

export default class LookupEventValuesUseCase {
  constructor(private lookupGateway: AuditLogLookupDynamoGateway) {}

  async execute(event: AuditLogEvent): PromiseResult<AuditLogEvent> {
    const attributes = {} as KeyValuePair<string, unknown>

    const attributeKeys = Object.keys(event.attributes)

    for (const attributeKey of attributeKeys) {
      const attributeValue = event.attributes[attributeKey]

      if (attributeValue && typeof attributeValue === "object" && "valueLookup" in attributeValue) {
        const { valueLookup } = attributeValue as KeyValuePair<string, string>
        const lookupItem = await this.lookupGateway.fetchById(valueLookup)

        if (isError(lookupItem)) {
          return lookupItem
        }

        attributes[attributeKey] = lookupItem.value
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
