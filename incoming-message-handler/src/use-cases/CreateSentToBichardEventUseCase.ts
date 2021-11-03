import type { AxiosError } from "axios"
import axios from "axios"
import type { AuditLog, PromiseResult } from "shared"
import { AuditLogEvent, HttpStatusCode } from "shared"
import * as https from "https"

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
})

export default class CreateSentToBichardEventUseCase {
  constructor(private readonly apiUrl: string, private readonly apiKey: string) {}

  create(message: AuditLog): PromiseResult<void> {
    const event = new AuditLogEvent({
      category: "information",
      timestamp: new Date(),
      eventType: "Message Sent to Bichard",
      eventSource: "Incoming Message Handler"
    })

    return axios
      .post(`${this.apiUrl}/messages/${message.messageId}/events`, event, {
        httpsAgent,
        headers: { "X-API-KEY": this.apiKey }
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
