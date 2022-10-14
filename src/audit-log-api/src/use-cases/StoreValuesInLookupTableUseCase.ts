import type { AuditLogEvent, BichardAuditLogEvent, KeyValuePair, PromiseResult, ValueLookup } from "shared-types"
import { AuditLogLookup, isError } from "shared-types"
import type { AuditLogLookupDynamoGateway, DynamoUpdate } from "../gateways/dynamo"

const maxAttributeValueLength = 1000

export default class StoreValuesInLookupTableUseCase {
  constructor(private readonly lookupGateway: AuditLogLookupDynamoGateway) {}

  async execute(event: AuditLogEvent, messageId: string): PromiseResult<AuditLogEvent> {
    const [dynamoUpdates, updatedEvent] = await this.prepare(event, messageId)

    const result = await this.lookupGateway.executeTransaction(dynamoUpdates)

    return isError(result) ? result : updatedEvent
  }

  async prepare(event: AuditLogEvent, messageId: string): Promise<[DynamoUpdate[], AuditLogEvent]> {
    const attributes: KeyValuePair<string, unknown> = {}
    const dynamoUpdates: DynamoUpdate[] = []

    const attributeKeys = Object.keys(event.attributes)

    for (const attributeKey of attributeKeys) {
      const attributeValue = event.attributes[attributeKey]
      if (attributeValue && typeof attributeValue === "string" && attributeValue.length > maxAttributeValueLength) {
        const lookupItem = new AuditLogLookup(attributeValue, messageId)
        const lookupDynamoUpdate = await this.lookupGateway.prepare(lookupItem)

        dynamoUpdates.push(lookupDynamoUpdate)
        attributes[attributeKey] = { valueLookup: lookupItem.id } as ValueLookup
      } else {
        attributes[attributeKey] = attributeValue
      }
    }

    let eventXml: string | undefined | ValueLookup =
      "eventXml" in event ? (event as BichardAuditLogEvent).eventXml : undefined
    if (eventXml) {
      const lookupItem = new AuditLogLookup(eventXml, messageId)
      const lookupDynamoUpdates = await this.lookupGateway.prepare(lookupItem)

      dynamoUpdates.push(lookupDynamoUpdates)
      eventXml = { valueLookup: lookupItem.id }
    }

    const updatedEvent = {
      ...event,
      attributes,
      ...(eventXml ? { eventXml } : {})
    } as AuditLogEvent
    return [dynamoUpdates, updatedEvent]
  }
}
