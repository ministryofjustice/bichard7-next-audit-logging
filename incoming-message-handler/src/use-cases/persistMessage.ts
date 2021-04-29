import axios, { AxiosError } from "axios"
import * as https from "https"
import { AuditLog, HttpStatusCode, PromiseResult } from "shared"

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
})

const persistMessage = async (message: AuditLog): PromiseResult<void> => {
  return axios
    .post(`${process.env.API_URL}/messages`, message, {
      httpsAgent
    })
    .then((result) =>
      result.status === HttpStatusCode.created ? null : Error(`Error ${result.status}: Could not create audit log.`)
    )
    .catch((error: AxiosError) => error)
}

export default persistMessage
