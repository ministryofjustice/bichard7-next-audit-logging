import axios, { AxiosError } from "axios"
import * as https from "https"
import { PromiseResult } from "@handlers/common"

const defaultHeaders = {
  "ibm-mq-rest-csrf-token": "blank",
  "Content-Type": "text/plain;charset=utf-8"
}

const createHttpsAgent = () => {
  return new https.Agent({
    rejectUnauthorized: false
  })
}

// eslint-disable-next-line import/prefer-default-export
export const post = (url: string, body: unknown, headers: { [key: string]: string } = {}): PromiseResult<void> => {
  return axios
    .post(url, body, {
      headers: { ...defaultHeaders, ...headers },
      httpsAgent: createHttpsAgent()
    })
    .then(() => undefined)
    .catch((error: AxiosError) => error)
}
