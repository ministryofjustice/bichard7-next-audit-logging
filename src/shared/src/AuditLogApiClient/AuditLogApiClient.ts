import axios from "axios"
import type { AxiosError } from "axios"
import * as https from "https"
import type { ApiClient, AuditLog, AuditLogEvent, PromiseResult } from "shared-types"
import { HttpStatusCode, logger } from "../utils"
import { ApplicationError } from "shared-types"

export type GetMessagesOptions = {
  status?: string
  lastMessageId?: string
}

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
})

export default class AuditLogApiClient implements ApiClient {
  constructor(private readonly apiUrl: string, private readonly apiKey: string, private readonly timeout: number = 0) {}

  private stringify(message: unknown): string {
    return typeof message === "string" ? message : JSON.stringify(message)
  }

  getMessages(options?: GetMessagesOptions): PromiseResult<AuditLog[]> {
    let queryString = ""
    const queries = []
    if (options && options.lastMessageId) {
      queries.push(`lastMessageId=${options.lastMessageId}`)
    }
    if (options && options.status) {
      queries.push(`status=${options.status}`)
    }
    if (queries.length > 0) {
      queryString = `?${queries.join("&")}`
    }

    return axios
      .get(`${this.apiUrl}/messages${queryString}`, {
        headers: { "X-API-Key": this.apiKey },
        timeout: this.timeout
      })
      .then((response) => response.data)
      .catch((error: AxiosError) => {
        logger.error(`Error getting messages: ${this.stringify(error.response?.data)}`)
        return new ApplicationError(
          `Error getting messages: ${this.stringify(error.response?.data) ?? error.message}`,
          error
        )
      })
  }

  getMessage(messageId: string): PromiseResult<AuditLog> {
    return axios
      .get(`${this.apiUrl}/messages/${messageId}`, {
        headers: { "X-API-Key": this.apiKey },
        timeout: this.timeout
      })
      .then((response) => response.data)
      .then((result) => result[0])
      .catch((error: AxiosError) => {
        logger.error(`Error getting messages: ${this.stringify(error.response?.data)}`)
        return new ApplicationError(
          `Error getting messages: ${this.stringify(error.response?.data) ?? error.message}`,
          error
        )
      })
  }

  createAuditLog(auditLog: AuditLog): PromiseResult<void> {
    return axios
      .post(`${this.apiUrl}/messages`, this.stringify(auditLog), {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey
        },
        timeout: this.timeout
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
        logger.error(`Error creating audit log: ${this.stringify(error.response?.data)}`)
        return new ApplicationError(
          `Error creating audit log: ${this.stringify(error.response?.data) ?? error.message}`,
          error
        )
      })
  }

  createEvent(messageId: string, event: AuditLogEvent): PromiseResult<void> {
    return axios
      .post(`${this.apiUrl}/messages/${messageId}/events`, event, {
        httpsAgent,
        headers: {
          "X-API-Key": this.apiKey
        },
        timeout: this.timeout
      })
      .then((result) => {
        switch (result.status) {
          case HttpStatusCode.created:
            return undefined
          case HttpStatusCode.notFound:
            return Error(`The message with Id ${messageId} does not exist.`)
          case HttpStatusCode.gatewayTimeout:
            return Error(`Timed out creating event for message with Id ${messageId}.`)
          default:
            return Error(`Error ${result.status}: Could not create audit log event.`)
        }
      })
      .catch((error: AxiosError) => {
        switch (error.code) {
          case "ECONNABORTED":
            return Error(`Timed out creating event for message with Id ${messageId}.`)
          default:
            logger.error(`Error creating event", ${this.stringify(error.response?.data)}`)
            return new ApplicationError(
              `Error creating event: ${this.stringify(error.response?.data) ?? error.message}`,
              error
            )
        }
      })
  }

  retryEvent(messageId: string): PromiseResult<void> {
    return axios
      .post(
        `${this.apiUrl}/messages/${messageId}/retry`,
        {},
        {
          httpsAgent,
          headers: {
            "X-API-Key": this.apiKey
          },
          timeout: this.timeout
        }
      )
      .then((result) => {
        switch (result.status) {
          case HttpStatusCode.noContent:
            return undefined
          case HttpStatusCode.notFound:
            return Error(`The message with Id ${messageId} does not exist.`)
          default:
            return Error(`Error ${result.status}: Could not retry audit log event.`)
        }
      })
      .catch((error: AxiosError) => {
        logger.error(`Error retrying event: ${this.stringify(error.response?.data)}`)
        return new ApplicationError(
          `Error retrying event: ${this.stringify(error.response?.data) ?? error.message}`,
          error
        )
      })
  }
}
