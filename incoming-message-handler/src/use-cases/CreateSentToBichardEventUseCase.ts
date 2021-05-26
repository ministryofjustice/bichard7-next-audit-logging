import axios, { AxiosError } from "axios"
import { AuditLog, AuditLogEvent, HttpStatusCode, PromiseResult } from "shared"
import * as https from "https"

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
})

export default class CreateSentToBichardEventUseCase {
  constructor(private readonly apiUrl: string) {}

  create(message: AuditLog): PromiseResult<void> {
    const event = new AuditLogEvent("information", new Date(), "Message Sent to Bichard")
    event.eventSource = "Incoming Message Handler"

    return axios
      .post(`${this.apiUrl}/messages/${message.messageId}/events`, event, {
        httpsAgent
      })
      .then((result) => {
        switch (result.status) {
          case HttpStatusCode.created:
            return undefined
          case HttpStatusCode.notFound:
            return Error(`The message with Id ${message.messageId} does not exist.`)
          default:
            return Error(`Error ${result.status}: Could not create audit log event.`)
        }
      })
      .catch((error: AxiosError) => error)
  }
}
