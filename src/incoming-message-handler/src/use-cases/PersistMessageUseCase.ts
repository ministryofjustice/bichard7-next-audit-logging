import type { AxiosError } from "axios"
import axios from "axios"
import * as https from "https"
import type { AuditLog, PromiseResult } from "shared-types"
import { HttpStatusCode } from "shared"

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
})

export default class PersistMessageUseCase {
  constructor(private readonly apiUrl: string, private readonly apiKey: string) {}

  persist(message: AuditLog): PromiseResult<Error | null> {
    return axios
      .post(`${this.apiUrl}/messages`, message, {
        httpsAgent,
        headers: { "X-API-KEY": this.apiKey }
      })
      .then((result) =>
        result.status === HttpStatusCode.created ? null : Error(`Error ${result.status}: Could not create audit log.`)
      )
      .catch((error: AxiosError) => error)
  }
}
