import type { AxiosError } from "axios"
import axios from "axios"
import * as https from "https"
import { HttpStatusCode } from "src/shared"
import type { ApiAuditLogEvent, PromiseResult, SendToBichardOutput } from "src/shared/types"
import { EventCode } from "src/shared/types"

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
})

export default class CreateSentToBichardEventUseCase {
  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string
  ) {}

  create(message: SendToBichardOutput): PromiseResult<void> {
    const event: ApiAuditLogEvent = {
      category: "information",
      eventCode: EventCode.ReceivedIncomingHearingOutcome,
      eventSource: "Incoming Message Handler",
      eventType: "Message Sent to Bichard",
      timestamp: message.sentAt
    }

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
