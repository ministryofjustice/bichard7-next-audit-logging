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
    .then((response) => JSON.parse(response.toString()))
    .then((result) =>
      result.statusCode === HttpStatusCode.created
        ? null
        : Error(`Could not create audit log. (Code ${result.statusCode})`)
    )
    .catch((error: AxiosError) => error)
}

export default persistMessage
