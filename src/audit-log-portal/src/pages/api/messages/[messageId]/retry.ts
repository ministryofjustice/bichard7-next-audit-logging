import type { NextApiRequest, NextApiResponse } from "next"
import config from "config"
import { logger } from "shared"

export default async (request: NextApiRequest, response: NextApiResponse<string>): Promise<void> => {
  const { messageId } = request.query
  const url = `${config.apiUrl}/messages/${messageId}/retry`
  try {
    const base64Decode = Buffer.from(request.cookies[".AUTH"].split(".")[1], "base64")
    const tokenPayload = JSON.parse(base64Decode.toString())
    logger.info({
      user: tokenPayload.username,
      ip: request.socket?.remoteAddress,
      message: `Retrying message: ${messageId}`
    })
  } catch (err) {
    logger.error(`ERROR: Invalid JWT: ${err}`)
    response.status(401).send("Invalid JWT")
  }

  const fetchResponse = await fetch(url, { method: "POST", headers: { "X-API-Key": config.apiKey } })

  response.status(fetchResponse.status)

  if (fetchResponse.status !== 200) {
    const errorMessage = await fetchResponse.text()

    logger.error(`Error POST fetch when retying message: ${errorMessage}`)

    response.send(errorMessage)
  } else {
    response.end()
  }
}
