import type { AuditLogEvent, KeyValuePair, PromiseResult, ValueLookup } from "src/shared/types"
import { isError } from "src/shared/types"
import type { AuditLogLookupDynamoGateway } from "../gateways/dynamo"

export default class LookupEventValuesUseCase {
  constructor(private lookupGateway: AuditLogLookupDynamoGateway) {}

  async execute(event: AuditLogEvent): PromiseResult<AuditLogEvent> {
    const attributes = {} as KeyValuePair<string, unknown>

    const attributeKeys = Object.keys(event.attributes ?? {})

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

    let { eventXml } = event as unknown as { eventXml: ValueLookup | string | undefined }
    if (eventXml && typeof eventXml === "object" && "valueLookup" in eventXml) {
      const { valueLookup } = eventXml
      const lookupItem = await this.lookupGateway.fetchById(valueLookup)

      if (isError(lookupItem)) {
        return lookupItem
      }

      if (!lookupItem) {
        return new Error("Could not find lookup item: " + valueLookup)
      }

      eventXml = lookupItem.value
    }

    return {
      ...event,
      attributes,
      ...(eventXml ? { eventXml } : {})
    } as AuditLogEvent
  }
}
