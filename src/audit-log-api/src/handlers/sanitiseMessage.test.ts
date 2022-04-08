jest.mock("../use-cases/FetchById")

import "../testConfig"
import type { APIGatewayProxyEvent } from "aws-lambda"
import { setEnvironmentVariables } from "shared-testing"
setEnvironmentVariables()
import sanitiseMessage from "./sanitiseMessage"
import FetchById from "../use-cases/FetchById"
// import { AuditLog, AuditLogEvent } from "shared-types"
import { HttpStatusCode } from "shared"

const createProxyEvent = (messageId?: string): APIGatewayProxyEvent => {
  return <APIGatewayProxyEvent>JSON.parse(
    JSON.stringify({
      pathParameters: {
        messageId
      }
    })
  )
}

test("returns BadRequest error when there is no message ID passed", async () => {
  const event = createProxyEvent(undefined)

  const result = await sanitiseMessage(event)

  expect(result.statusCode).toBe(HttpStatusCode.badRequest)
  expect(result.body).toBe("No message ID in request")
})

test("returns Internal Server error when there is an error from Dynamo", async () => {
  const expectedError = "Something bad happened"
  jest.spyOn(FetchById.prototype, "fetch").mockResolvedValue(new Error(expectedError))
  const event = createProxyEvent("MessageId")

  const result = await sanitiseMessage(event)

  expect(result.statusCode).toBe(HttpStatusCode.internalServerError)
  expect(result.body).toBe(expectedError)
})

// test("deletes all versions of messages from S3", async () => {
//   // const s3Path = "someEvent.xml"
//   // const auditLogEvent = new BichardAuditLogEvent({
//   //       eventSource: "Dummy Event Source",
//   //       eventSourceArn: "Dummy Event Arn",
//   //       eventSourceQueueName: "SANITISE_DUMMY_QUEUE",
//   //       eventType: "Dummy Message",
//   //       category: "error",
//   //       timestamp: new Date(),
//   //       s3Path
//   //     })

//     const createAuditLogEvent = (timestamp: Date, eventType: string): AuditLogEvent =>
//       new AuditLogEvent({
//         category: "information",
//         timestamp,
//         eventType,
//         eventSource: "Test"
//       })

//     const log = new AuditLog("1", new Date(2021, 10, 12), "Dummy hash")
//     log.events = [
//       createAuditLogEvent(new Date("2021-06-20T10:12:13"), "Event 1"),
//       createAuditLogEvent(new Date("2021-06-15T10:12:13"), "Event 2"),
//       createAuditLogEvent(new Date("2021-06-10T10:12:13"), "Event 3")
//     ]

//   const fetchByIdSpy = jest.spyOn(FetchById.prototype, "fetch").mockResolvedValue(log)

//   // mock response from S3 list bucket with 3 objects

//   // spi on S3 delete object to be called 3 times with objects names

//   const event = createProxyEvent("Message Id")
//   await sanitiseMessages(event)

//   expect(fetchByIdSpy).toBeCalledWith("Message Id")
// })
