import type { NextApiRequest, NextApiResponse } from "next"
import type GetMessageByIdResult from "types/GetMessageByIdResult"
import config from "config"

export default async (request: NextApiRequest, response: NextApiResponse<GetMessageByIdResult>) => {
  const { messageId } = request.query
  const fetchResponse = await fetch(`${config.apiUrl}/messages/${messageId}`)
  const messages = (await fetchResponse.json()) || []

  if (messages.length === 0) {
    response.status(404).end()
  } else {
    response.status(200).json({ message: messages[0] })
  }
}
