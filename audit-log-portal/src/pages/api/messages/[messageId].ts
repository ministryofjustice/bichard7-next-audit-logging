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

  console.log(`Found ${messages.length} messages`)

  if (messages.length === 0) {
    console.log("Returning not found")
    response.status(404).end()
  } else {
    console.log("Returning messages")
    response.status(200).json({ message: messages[0] })
  }
}
