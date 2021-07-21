import type { NextApiRequest, NextApiResponse } from "next"
import type PostMessageRetry from "types/PostMessageRetry"
import config from "config"

export default async (request: NextApiRequest, response: NextApiResponse<PostMessageRetry>): Promise<void> => {
  const { messageId } = request.query
  const url = `${config.apiUrl}/messages/${messageId}/retry`

  const fetchResponse = await fetch(url, { method: "POST" })

  if (fetchResponse.status !== 200) {
    response.status(404).end()
  } else {
    response.status(200).end()
  }
}
