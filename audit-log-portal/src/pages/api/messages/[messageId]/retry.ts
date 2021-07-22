import type { NextApiRequest, NextApiResponse } from "next"
import type PostMessageRetry from "types/PostMessageRetry"
import config from "config"

export default async (request: NextApiRequest, response: NextApiResponse<PostMessageRetry | string>): Promise<void> => {
  const { messageId } = request.query
  const url = `${config.apiUrl}/messages/${messageId}/retry`

  const fetchResponse = await fetch(url, { method: "POST" })

  if (fetchResponse.status !== 200) {
    const errorMessage = await fetchResponse.text()
    response.status(fetchResponse.status).send(errorMessage)
  } else {
    const message = await fetchResponse.json()
    response.status(200).json({ message })
  }
}
