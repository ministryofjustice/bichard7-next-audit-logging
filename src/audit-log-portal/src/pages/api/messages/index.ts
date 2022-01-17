import type { NextApiRequest, NextApiResponse } from "next"
import type MessageSearchResult from "types/MessageSearchResult"
import config from "config"
import convertObjectToURLSearchParams from "utils/convertObjectToURLSearchParams"
import combineUrlAndQueryString from "utils/combineUrlAndQueryString"

export default async (
  request: NextApiRequest,
  response: NextApiResponse<MessageSearchResult | string>
): Promise<void> => {
  const params = convertObjectToURLSearchParams(request.query)
  const baseUrl = `${config.apiUrl}/messages`
  const url = combineUrlAndQueryString(baseUrl, params.toString())

  const fetchResponse = await fetch(url, { headers: { "X-API-Key": config.apiKey } })

  if (fetchResponse.status !== 200) {
    const errorMessage = await fetchResponse.text()
    response.status(fetchResponse.status).send(errorMessage)
  } else {
    const messages = await fetchResponse.json()
    response.status(200).json({ messages })
  }
}