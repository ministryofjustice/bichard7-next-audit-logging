import axios from "axios"
import { AuditLog, PromiseResult } from "shared"
import { AuditLogEvent } from "src/types"

export default class ApiGateway {
  constructor(private readonly apiUrl: string) {}

  getMessages(): PromiseResult<AuditLog[]> {
    return axios
      .get(`${this.apiUrl}/messages`)
      .then((response) => response.data)
      .catch((error) => <Error>error)
  }

  getMessage(messageId: string): PromiseResult<AuditLog> {
    return axios
      .get(`${this.apiUrl}/messages/${messageId}`)
      .then((response) => {
        // Currently, this endpoint returns all messages, so we need to
        // filter by the given message Id
        // TODO: When we fix the endpoint, replace this code.
        const messages = response.data.messages || response.data || []
        return messages.find((message: AuditLog) => message.messageId === messageId)
      })
      .catch((error) => <Error>error)
  }

  createAuditLog(auditLog: AuditLog): PromiseResult<void> {
    return axios
      .post(`${this.apiUrl}/messages`, JSON.stringify(auditLog), {
        headers: {
          "Content-Type": "application/json"
        }
      })
      .then(() => undefined)
      .catch((error) => <Error>error)
  }

  createAuditLogEvent(messageId: string, auditLogEvent: AuditLogEvent): PromiseResult<void> {
    return axios
      .post(`${this.apiUrl}/messages/${messageId}/events`, JSON.stringify(auditLogEvent), {
        headers: {
          "Content-Type": "application/json"
        }
      })
      .then(() => undefined)
      .catch((error) => <Error>error)
  }
}
