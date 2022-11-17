import fs from "fs"
import { isError } from "lodash"
import { decodeBase64, S3Gateway } from "src/shared"
import { AuditLogEvent, DynamoAuditLog } from "src/shared/types"
import { AuditLogDynamoGateway, DynamoUpdate } from "../gateways/dynamo"
import { addAuditLogEventIndices, transformAuditLogEvent } from "../utils"
import LookupEventValuesUseCase from "./LookupEventValuesUseCase"

const getEventXmlFromS3 = async (s3Gateway: S3Gateway, s3Path: string): Promise<string> => {
  const eventJson = await s3Gateway.getItem(s3Path)

  if (isError(eventJson)) {
    throw eventJson
  }

  let eventJsonContent

  try {
    eventJsonContent = JSON.parse(eventJson)
  } catch (err) {
    throw isError(err) ? err : Error("Error parsing JSON from S3 object")
  }

  if (!eventJsonContent.messageData) {
    throw Error(`Event JSON does not have required 'messageData' key`)
  }

  const eventXml = decodeBase64(eventJsonContent.messageData)

  if (!eventXml) {
    throw Error(`Could not base64 decode event message`)
  }

  return eventXml
}

const migrateToNewStructure = async (
  gateway: AuditLogDynamoGateway,
  lookupUseCase: LookupEventValuesUseCase,
  s3Gateway: S3Gateway,
  auditLog: DynamoAuditLog
) => {
  // - For each event:
  //     X Transform it into new structure
  //          X Remove eventSourceArn and s3Path
  //          X Pull attributes from lookup table into event
  //          X Add eventCode (lookup event type)
  //          X Add indices (topExceptionsReport, automationReport)
  //          X Add event XML from S3 if it's from a failure queue and it's not been sanitised
  //     X Insert into events table
  //
  // X Remove events attribute
  // X Remove automationReport, topExceptionsReport, lastEventType
  // X Ensure isSanitised is set
  // X Ensure nextSanitiseCheck is set to current datetime if not set and isSanitised is false
  //
  // Eventually, once everything is done:
  // - Remove lookup table

  const newEventsPromises = (auditLog.events ?? [])
    .map(transformAuditLogEvent)
    .map(addAuditLogEventIndices)
    .map((event) => lookupUseCase.execute(event))

  let newEvents = await Promise.all(newEventsPromises)

  newEvents.forEach((event) => {
    if (isError(event)) {
      throw event
    }
  })

  newEvents = newEvents as AuditLogEvent[]

  const s3PathsToDelete: string[] = []

  if (!auditLog.isSanitised) {
    newEvents = await Promise.all(
      newEvents.map(async (event) => {
        if (isError(event)) {
          throw event
        }

        if (event.eventSourceQueueName && event.category === "error" && event.s3Path && !event.eventXml) {
          event.eventXml = await getEventXmlFromS3(s3Gateway, event.s3Path)
          s3PathsToDelete.push(event.s3Path)
        }

        return event
      })
    )
  }

  newEvents.forEach((event) => {
    if (isError(event)) {
      throw event
    }

    delete event.s3Path
    delete event.eventSourceArn
  })

  const eventUpdates = await gateway.prepareStoreEvents(auditLog.messageId, newEvents as AuditLogEvent[])
  if (isError(eventUpdates)) {
    throw eventUpdates
  }

  delete (auditLog as any).events
  delete auditLog.automationReport
  delete auditLog.topExceptionsReport
  delete auditLog.lastEventType

  if (!auditLog.isSanitised) {
    auditLog.isSanitised = 0
    if (!auditLog.nextSanitiseCheck) {
      auditLog.nextSanitiseCheck = new Date().toISOString()
    }
  }

  const oldVersion = auditLog.version
  auditLog.version = oldVersion + 1

  const auditLogReplaceQuery: DynamoUpdate = {
    Put: {
      TableName: gateway.config.auditLogTableName,
      Item: { _: "_", ...auditLog },
      ConditionExpression: `attribute_exists(${gateway.auditLogTableKey}) and version = :version`,
      ExpressionAttributeValues: {
        ":version": oldVersion
      }
    }
  }

  const result = await gateway.executeTransaction([auditLogReplaceQuery, ...eventUpdates])
  if (isError(result)) {
    throw result
  }

  fs.appendFileSync("s3-paths-to-delete.txt", `${s3PathsToDelete.join("\n")}\n`)
}

export default migrateToNewStructure
