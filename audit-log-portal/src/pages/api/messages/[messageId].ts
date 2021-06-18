import type { NextApiRequest, NextApiResponse } from "next"
import { AuditLog } from "shared"
import config from "config"

type Data = {
  message: AuditLog
}

export default async (request: NextApiRequest, response: NextApiResponse<Data>) => {
  const { messageId } = request.query
  const fetchResponse = await fetch(`${config.apiUrl}/messages/${messageId}`)
  const messages = (await fetchResponse.json()) || []

  if (messages.length === 0) {
    response.status(404)
  } else {
    response.status(200).json({ message: messages[0] })
  }
}
