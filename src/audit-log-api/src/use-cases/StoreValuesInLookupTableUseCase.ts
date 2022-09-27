import type {
  AuditLogEvent,
  AuditLogLookupDynamoGateway,
  BichardAuditLogEvent,
  DynamoUpdate,
  KeyValuePair,
  PromiseResult,
  ValueLookup
} from "shared-types"
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

        attributes[attributeKey] = { valueLookup: lookupItem.id } as ValueLookup
      } else {
        attributes[attributeKey] = attributeValue
      }
    }

    let eventXml: string | undefined | ValueLookup =
      "eventXml" in event ? (event as BichardAuditLogEvent).eventXml : undefined
    if (eventXml) {
      const lookupItem = await this.lookupGateway.create(new AuditLogLookup(eventXml, messageId))

      if (isError(lookupItem)) {
        return lookupItem
      }

      eventXml = { valueLookup: lookupItem.id }
    }

    return {
      ...event,
      attributes,
      ...(eventXml ? { eventXml } : {})
    } as AuditLogEvent
  }

  async prepare(event: AuditLogEvent, messageId: string): Promise<[DynamoUpdate[], AuditLogEvent]> {
    const attributes: KeyValuePair<string, unknown> = {}
    const transactionParams: DynamoUpdate[] = []

    const attributeKeys = Object.keys(event.attributes)

    for (const attributeKey of attributeKeys) {
      const attributeValue = event.attributes[attributeKey]
      if (attributeValue && typeof attributeValue === "string" && attributeValue.length > maxAttributeValueLength) {
        const lookupItem = new AuditLogLookup(attributeValue, messageId)
        const lookupPutParams = await this.lookupGateway.prepare(lookupItem)

        transactionParams.push(lookupPutParams)
        attributes[attributeKey] = { valueLookup: lookupItem.id } as ValueLookup
      } else {
        attributes[attributeKey] = attributeValue
      }
    }

    let eventXml: string | undefined | ValueLookup =
      "eventXml" in event ? (event as BichardAuditLogEvent).eventXml : undefined
    if (eventXml) {
      const lookupItem = new AuditLogLookup(eventXml, messageId)
      const lookupPutParams = await this.lookupGateway.prepare(lookupItem)

      transactionParams.push(lookupPutParams)
      eventXml = { valueLookup: lookupItem.id }
    }

    const updatedEvent = {
      ...event,
      attributes,
      ...(eventXml ? { eventXml } : {})
    } as AuditLogEvent
    return [transactionParams, updatedEvent]
  }
}
