import axios, { AxiosError } from "axios"
import * as https from "https"
import { AuditLog, HttpStatusCode, PromiseResult } from "shared"

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
})

export default class PersistMessageUseCase {
  constructor(private readonly apiUrl: string) {}

  persist(message: AuditLog): PromiseResult<void> {
    return axios
      .post(`${this.apiUrl}/messages`, message, {
        httpsAgent
      })
      .then((result) =>
        result.status === HttpStatusCode.created ? null : Error(`Error ${result.status}: Could not create audit log.`)
      )
      .catch((error: AxiosError) => error)
  }
}
