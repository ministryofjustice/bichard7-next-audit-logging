import type { NextApiRequest, NextApiResponse } from "next"
import type GetMessageEventsResult from "types/GetMessageEventsResult"
import config from "config"

export default async (request: NextApiRequest, response: NextApiResponse<GetMessageEventsResult>): Promise<void> => {
  const { messageId } = request.query
  const url = `${config.apiUrl}/messages/${messageId}/events`

  const fetchResponse = await fetch(url, { headers: { "X-API-Key": config.apiKey } })

  if (fetchResponse.status !== 200) {
    response.status(404).end()
  } else {
    const events = (await fetchResponse.json()) || []
    response.status(200).json({ events })
  }
}
