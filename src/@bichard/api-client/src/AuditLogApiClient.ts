import axios from "axios"
import type { AxiosError } from "axios"
import * as https from "https"
import type { AuditLog, AuditLogEvent, PromiseResult } from "shared"
import { HttpStatusCode } from "shared"
import type ApiClient from "./ApiClient"

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
})

export default class AuditLogApiClient implements ApiClient {
  constructor(private readonly apiUrl: string, private readonly apiKey: string) {}

  getMessage(messageId: string): PromiseResult<AuditLog> {
    return axios
      .get(`${this.apiUrl}/messages/${messageId}`, { headers: { "X-API-Key": this.apiKey } })
      .then((response) => response.data)
      .then((result) => result[0])
      .catch((error: AxiosError) => {
        console.error("Error getting message", error.response?.data)
        return error
      })
  }

  createAuditLog(auditLog: AuditLog): PromiseResult<void> {
    return axios
      .post(`${this.apiUrl}/messages`, JSON.stringify(auditLog), {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey
        }
      })
      .then((result) => {
        switch (result.status) {
          case HttpStatusCode.created:
            return undefined
          default:
            return Error(`Error ${result.status}: ${result.data}`)
        }
      })
      .catch((error: AxiosError) => {
        console.error("Error creating audit log", error.response?.data)
        return error
      })
  }

  createEvent(messageId: string, event: AuditLogEvent): PromiseResult<void> {
    return axios
      .post(`${this.apiUrl}/messages/${messageId}/events`, event, {
        httpsAgent,
        headers: {
          "X-API-Key": this.apiKey
        }
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
      .catch((error: AxiosError) => {
        console.error("Error creating event", error.response?.data)
        return error
      })
  }
}
