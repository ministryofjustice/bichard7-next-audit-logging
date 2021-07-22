import axios from "axios"
import type { AxiosError } from "axios"
import * as https from "https"
import type { AuditLogEvent, PromiseResult } from "shared"
import { HttpStatusCode } from "shared"

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
})

export default class ApiClient {
  constructor(private readonly apiUrl: string) {}

  createEvent(messageId: string, event: AuditLogEvent): PromiseResult<void> {
    return axios
      .post(`${this.apiUrl}/messages/${messageId}/events`, event, {
        httpsAgent
      })
      .then((result) => {
        switch (result.status) {
          case HttpStatusCode.created:
            return undefined
          case HttpStatusCode.notFound:
            return Error(`The message with Id ${messageId} does not exist.`)
          default:
            return Error(`Error ${result.status}: Could not create audit log event.`)
        }
      })
      .catch((error: AxiosError) => error)
  }
}
