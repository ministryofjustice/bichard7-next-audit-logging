import type { AxiosError } from "axios"
import axios from "axios"
import type { SendToBichardOutput, PromiseResult } from "shared-types"
import { AuditLogEvent } from "shared-types"
import { HttpStatusCode } from "shared"
import * as https from "https"

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
})

export default class CreateSentToBichardEventUseCase {
  constructor(private readonly apiUrl: string, private readonly apiKey: string) {}

  create(message: SendToBichardOutput): PromiseResult<void> {
    const event = new AuditLogEvent({
      category: "information",
      timestamp: message.sentAt,
      eventType: "Message Sent to Bichard",
      eventSource: "Incoming Message Handler"
    })

    return axios
      .post(`${this.apiUrl}/messages/${message.auditLog.messageId}/events`, event, {
        httpsAgent,
        headers: { "X-API-KEY": this.apiKey }
      })
      .then((result) => {
        switch (result.status) {
          case HttpStatusCode.created:
            return undefined
          case HttpStatusCode.notFound:
            return Error(`The message with Id ${message.auditLog.messageId} does not exist.`)
          default:
            return Error(`Error ${result.status}: Could not create audit log event.`)
        }
      })
      .catch((error: AxiosError) => error)
  }
}
