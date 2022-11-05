import type { AxiosError } from "axios"
import axios from "axios"
import * as https from "https"
import type { ApiClient, AuditLog, AuditLogEvent, PromiseResult } from "src/shared/types"
import { ApplicationError } from "src/shared/types"
import type { GetMessageOptions, GetMessagesOptions } from "src/shared/types/ApiClient"
import { addQueryParams, HttpStatusCode, logger } from "../utils"

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
})

export default class AuditLogApiClient implements ApiClient {
  constructor(private readonly apiUrl: string, private readonly apiKey: string, private readonly timeout: number = 0) {}

  private stringify(message: unknown): string {
    return typeof message === "string" ? message : JSON.stringify(message)
  }

  getMessages(options?: GetMessagesOptions): PromiseResult<AuditLog[]> {
    const url = addQueryParams(`${this.apiUrl}/messages`, options)

    return axios
      .get(url, {
        headers: { "X-API-Key": this.apiKey },
        timeout: this.timeout
      })
      .then((response) => response.data)
      .catch((error: AxiosError) => {
        if (error.response?.status === HttpStatusCode.notFound) {
          return []
        }

        logger.error(`Error getting messages: ${this.stringify(error.response?.data)}`)
        return new ApplicationError(
          `Error getting messages: ${this.stringify(error.response?.data) ?? error.message}`,
          error
        )
      })
  }

  getMessage(messageId: string, options: GetMessageOptions = {}): PromiseResult<AuditLog> {
    const queryParams: string[] = []
    let queryString = ""
    if (options?.includeColumns) {
      queryParams.push(`includeColumns=${options.includeColumns.join(",")}`)
    }
    if (options?.excludeColumns) {
      queryParams.push(`includeColumns=${options.excludeColumns.join(",")}`)
    }
    if (queryParams.length > 0) {
      queryString = `?${queryParams.join("&")}`
    }
    return axios
      .get(`${this.apiUrl}/messages/${messageId}${queryString}`, {
        headers: { "X-API-Key": this.apiKey },
        timeout: this.timeout
      })
      .then((response) => response.data)
      .then((result) => result[0])
      .catch((error: AxiosError) => {
        if (error.response?.status === HttpStatusCode.notFound) {
          return undefined
        }

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

  fetchUnsanitised(options: GetMessageOptions = {}): PromiseResult<AuditLog[]> {
    const url = addQueryParams(`${this.apiUrl}/messages`, {
      limit: options.limit,
      includeColumns: options.includeColumns?.join(","),
      excludeColumns: options.excludeColumns?.join(","),
      unsanitised: true
    })

    return axios
      .get(url, {
        headers: { "X-API-Key": this.apiKey },
        timeout: this.timeout
      })
      .then((response) => response.data)
      .catch((error: AxiosError) => {
        logger.error(`Error getting unsanitised messages: ${this.stringify(error.response?.data)}`)
        return new ApplicationError(
          `Error getting unsanitised messages: ${this.stringify(error.response?.data) ?? error.message}`,
          error
        )
      })
  }

  sanitiseMessage(messageId: string): PromiseResult<void> {
    return axios
      .post(
        `${this.apiUrl}/messages/${messageId}/sanitise`,
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
        if (result.status === HttpStatusCode.noContent) {
          return
        } else if (result.status === HttpStatusCode.notFound) {
          return Error(`The message with Id ${messageId} does not exist.`)
        } else {
          logger.error({
            message: `Error from audit log api while sanitising`,
            responseCode: result.status,
            messageId: messageId,
            data: result.data
          })
          return new ApplicationError(
            `Error from audit log api while sanitising: ${this.stringify(result.data)}`,
            result.data
          )
        }
      })
      .catch((error: AxiosError) => {
        logger.error({
          message: `Error sanitising message`,
          error: error.message,
          messageId: messageId
        })
        return new ApplicationError(
          `Error sanitising message: ${this.stringify(error.response?.data) ?? error.message}`,
          error
        )
      })
  }
}
