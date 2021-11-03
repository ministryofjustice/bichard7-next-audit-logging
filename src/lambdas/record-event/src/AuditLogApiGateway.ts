import axios from "axios"
import type { AuditLog, AuditLogEvent, PromiseResult } from "shared"

export default class AuditLogApiGateway {
  constructor(private readonly apiUrl: string, private readonly apiKey: string) {}

  getMessages(): PromiseResult<AuditLog[]> {
    return axios
      .get(`${this.apiUrl}/messages`, { headers: { "X-API-Key": this.apiKey } })
      .then((response) => response.data)
      .catch((error) => <Error>error)
  }

  getMessage(messageId: string): PromiseResult<AuditLog> {
    return axios
      .get(`${this.apiUrl}/messages/${messageId}`, { headers: { "X-API-Key": this.apiKey } })
      .then((response) => response.data)
      .then((result) => result[0])
      .catch((error) => <Error>error)
  }

  createAuditLog(auditLog: AuditLog): PromiseResult<void> {
    return axios
      .post(`${this.apiUrl}/messages`, JSON.stringify(auditLog), {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey
        }
      })
      .then(() => undefined)
      .catch((error) => <Error>error)
  }

  createAuditLogEvent(messageId: string, auditLogEvent: AuditLogEvent): PromiseResult<void> {
    return axios
      .post(`${this.apiUrl}/messages/${messageId}/events`, JSON.stringify(auditLogEvent), {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey
        }
      })
      .then(() => undefined)
      .catch((error) => <Error>error)
  }
}
