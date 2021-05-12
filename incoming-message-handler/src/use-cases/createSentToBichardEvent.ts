import axios, { AxiosError } from "axios"
import { AuditLog, AuditLogEvent, HttpStatusCode, PromiseResult } from "shared"
import * as https from "https"

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
})
const sentToBichardEventType = "Message Sent to Bichard"

export default function createSentToBichardEvent(message: AuditLog): PromiseResult<void> {
  const event = new AuditLogEvent("information", new Date(), sentToBichardEventType)

  return axios
    .post(`${process.env.API_URL}/messages/${message.messageId}/events`, event, {
      httpsAgent
    })
    .then((result) => {
      switch (result.status) {
        case HttpStatusCode.created:
          return undefined
        case HttpStatusCode.notFound:
          return Error(`Error ${result.status}: A message with Id ${message.messageId} does not exist in the database.`)
        default:
          return Error(`Error ${result.status}: Could not create audit log event.`)
      }
    })
    .catch((error: AxiosError) => error)
}
