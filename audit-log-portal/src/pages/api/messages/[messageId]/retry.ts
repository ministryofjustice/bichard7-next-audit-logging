import type { NextApiRequest, NextApiResponse } from "next"
import config from "config"

export default async (request: NextApiRequest, response: NextApiResponse<string>): Promise<void> => {
  const { messageId } = request.query
  const url = `${config.apiUrl}/messages/${messageId}/retry`

  const fetchResponse = await fetch(url, { method: "POST", headers: { "X-API-Key": config.apiKey } })

  response.status(fetchResponse.status)

  if (fetchResponse.status !== 200) {
    const errorMessage = await fetchResponse.text()
    response.send(errorMessage)
  } else {
    response.send("")
  }
}
