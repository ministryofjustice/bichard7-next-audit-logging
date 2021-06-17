import type { NextApiRequest, NextApiResponse } from "next"
import { AuditLog } from "shared"
import config from "config"
import convertObjectToURLSearchParams from "utils/convertObjectToURLSearchParams"
import combineUrlAndQueryString from "utils/combineUrlAndQueryString"

type Data = {
  messages: AuditLog[]
}

export default async (request: NextApiRequest, response: NextApiResponse<Data>) => {
  const params = convertObjectToURLSearchParams(request.query)
  const baseUrl = `${config.apiUrl}/messages`
  const url = combineUrlAndQueryString(baseUrl, params.toString())

  const fetchResponse = await fetch(url)
  const messages = await fetchResponse.json()

  response.status(200).json({ messages })
}
