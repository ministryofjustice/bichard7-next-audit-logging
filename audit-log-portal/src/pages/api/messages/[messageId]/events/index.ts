import type { NextApiRequest, NextApiResponse } from "next"
import { AuditLogEvent } from "shared"
import config from "config"

type Data = {
  events: AuditLogEvent[]
}

export default async (request: NextApiRequest, response: NextApiResponse<Data>) => {
  const { messageId } = request.query
  const url = `${config.apiUrl}/messages/${messageId}/events`

  const fetchResponse = await fetch(url)

  if (fetchResponse.status !== 200) {
    response.status(404).end()
  } else {
    const events = (await fetchResponse.json()) || []
    response.status(200).json({ events })
  }
}
