/*
 *
 * This script
 *    - retrieves audit log events from DynamoDB for the specified date range (start and end arguments)
 *    - filters new UI events
 *    - generates report by event date and username
 *
 * To run this script:
 * aws-vault exec qsolution-production -- npx ts-node -T ./scripts/utils/new-ui-usage-report.ts {start} {end}
 *
 * e.g.
 * aws-vault exec qsolution-production -- npx ts-node -T ./scripts/utils/new-ui-usage-report.ts 2023-10-01 2023-11-01
 *
 */


import { Lambda } from "aws-sdk"
import { AuditLogDynamoGateway, DynamoDbConfig } from "../../src/audit-log-api/gateways/dynamo"
import { EventCode, isError } from "../../src/shared/types"
import { DynamoAuditLogEvent } from "../../src/shared/types/AuditLogEvent"
import fs from "fs"
import { IndexSearcher } from "../../src/audit-log-api/gateways/dynamo/DynamoGateway"

type ReportData = {
  all: Record<EventCode, number>
  byUser: Record<string, Record<EventCode, number>>
  byDate: Record<string, Record<EventCode, number>>
  eventCodes: EventCode[]
}

const WORKSPACE = process.env.WORKSPACE ?? "production"
let dynamo: AuditLogDynamoGateway

const dynamoConfig: DynamoDbConfig = {
  auditLogTableName: "Not needed",
  eventsTableName: `bichard-7-${WORKSPACE}-audit-log-events`,
  endpoint: "Will be retrieved from Retry Message lambda environment variable",
  region: "eu-west-2"
}

function log(...params: unknown[]) {
  const logContent = [new Date().toISOString(), " - ", ...params]
  console.log(...logContent)
}

const getDateString = (date: string | Date) => (typeof date === "object" ? date.toISOString() : date).split("T")[0]

const getDates = (start: Date, end: Date) => {
  let date = new Date(start)
  const dates: string[] = []
  while (date <= end) {
    dates.push(getDateString(date))
    date.setDate(date.getDate() + 1)
  }

  return dates
}

async function setup() {
  const lambda = new Lambda({ region: "eu-west-2" })
  const retryLambda = await lambda.getFunction({ FunctionName: `bichard-7-${WORKSPACE}-retry-message` }).promise()
  if (isError(retryLambda)) {
    throw Error("Couldn't get DynamoDB connection details")
  }

  dynamoConfig.endpoint = retryLambda.Configuration?.Environment?.Variables?.AWS_URL || ""
  if (!dynamoConfig.endpoint) {
    throw Error("Couldn't get DynamoDB URL")
  }

  dynamoConfig.auditLogTableName = retryLambda.Configuration?.Environment?.Variables?.AUDIT_LOG_TABLE_NAME || ""
  if (!dynamoConfig.auditLogTableName) {
    throw Error("Couldn't get DynamoDB table name")
  }

  dynamoConfig.eventsTableName = retryLambda.Configuration?.Environment?.Variables?.AUDIT_LOG_EVENTS_TABLE_NAME || ""
  if (!dynamoConfig.eventsTableName) {
    throw Error("Couldn't get DynamoDB events table name")
  }

  dynamo = new AuditLogDynamoGateway(dynamoConfig)
}

function filterEvents(events: DynamoAuditLogEvent[]) {
  return events.filter((event) => event.eventSource === "Bichard New UI")
}

async function findEvents(dynamo: AuditLogDynamoGateway, start: Date, end: Date) {
  log(`Getting messages for the period between ${start} and ${end}`)
  let lastMessage
  let events: DynamoAuditLogEvent[] = []
  const messageIds = new Set<string>()
  let totalEventsFetched = 0
  console.log("Fetching messages and events...")

  while (true) {
    const fetchedEvents = await new IndexSearcher<DynamoAuditLogEvent[]>(dynamo, dynamoConfig.eventsTableName, "_id")
    .useIndex(`timestampIndex`)
    .setIndexKeys("_", "_", "timestamp")
    .setBetweenKey(start.toISOString(), end.toISOString())
    .paginate(1000, lastMessage)
    .execute()

  if (isError(fetchedEvents)) {
    return fetchedEvents
  }

    if (fetchedEvents.length === 0) {
      return events
    }

    fetchedEvents.forEach((event) => messageIds.add(event._messageId))
    lastMessage = fetchedEvents.slice(-1)[0]
    events = events.concat(filterEvents(fetchedEvents))
    totalEventsFetched += fetchedEvents.length
    console.log(
      "Total cases:",
      messageIds.size,
      ", Total events:",
      totalEventsFetched,
      ", Total new UI events:",
      events.length,
      ", Current date:",
      lastMessage?.timestamp
    )
  }
}

const generateReportData = (events: DynamoAuditLogEvent[], start: Date, end: Date): ReportData => {
  const eventCodes = new Set<EventCode>()
  const allEvents = events.reduce((acc: Record<string, number>, event) => {
    acc[event.eventCode] = (acc[event.eventCode] || 0) + 1
    eventCodes.add(event.eventCode as EventCode)
    return acc
  }, {})

  const eventsByUser = events.reduce((acc: Record<string, Record<EventCode, number>>, event) => {
    const username = event.user || "Unknown"
    acc[username] = {
      ...(acc[username] ?? {}),
      [event.eventCode]: (acc[username]?.[event.eventCode] || 0) + 1
    }
    return acc
  }, {})

  let eventsByDate = getDates(start, end).reduce((acc: Record<string, Record<EventCode, number>>, date: string) => {
    acc[date] = {} as Record<EventCode, number>
    return acc
  }, {})
  events.forEach((event) => {
    const date = getDateString(event.timestamp)
    eventsByDate[date] = {
      ...(eventsByDate[date] ?? {}),
      [event.eventCode]: (eventsByDate[date]?.[event.eventCode] || 0) + 1
    }
  })

  return {
    all: allEvents,
    byUser: eventsByUser,
    byDate: eventsByDate,
    eventCodes: Array.from(eventCodes) as EventCode[]
  }
}

const convertToCsv = (reportData: ReportData) => {
  const result: Record<string, string> = {}
  const eventCodes = reportData.eventCodes
  const eventTitles = eventCodes.map((code) => code[0].toUpperCase() + code.slice(1).replace(/\.|-/g, " "))

  const byDateHeader = ["Date", ...eventTitles].join(",")
  const byDateFooter = ["Total", ...eventCodes.map((code) => reportData.all[code])]
  const byDate: string[] = [byDateHeader]
  Object.entries(reportData.byDate).forEach(([date, data]) => {
    const lineData = [date, ...eventCodes.map((eventCode) => data[eventCode] || 0)]
    byDate.push(lineData.join(","))
  })
  byDate.push(byDateFooter.join(","))

  const byUserHeader = ["User", ...eventTitles].join(",")
  const byUserFooter = ["Total", ...eventCodes.map((code) => reportData.all[code])]
  const byUser: string[] = [byUserHeader]
  Object.entries(reportData.byUser).forEach(([date, data]) => {
    const lineData = [date, ...eventCodes.map((eventCode) => data[eventCode] || 0)]
    byUser.push(lineData.join(","))
  })
  byUser.push(byUserFooter.join(","))

  result["byDate"] = byDate.join("\n")
  result["byUser"] = byUser.join("\n")

  return result
}

const run = async () => {
  await setup()
  const start = new Date(process.argv.slice(-2)[0])
  const end = new Date(process.argv.slice(-1)[0])

  const events = await findEvents(dynamo, start, end)
  if(isError(events)) {
    throw events
  }

  const reportData = generateReportData(events, start, end)
  const csvData = convertToCsv(reportData)

  const reportByDateFilename = `New UI Report by Date (${getDateString(start)} to ${getDateString(end)}).csv`
  fs.writeFileSync(reportByDateFilename, csvData.byDate)
  console.log("Report by date generated:", reportByDateFilename)
  const reportByUserFilename = `New UI Report by User (${getDateString(start)} to ${getDateString(end)}).csv`
  fs.writeFileSync(reportByUserFilename, csvData.byUser)
  console.log("Report by user generated:", reportByUserFilename)
}

run()
