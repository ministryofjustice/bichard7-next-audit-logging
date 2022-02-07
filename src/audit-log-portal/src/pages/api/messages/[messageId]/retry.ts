import type { NextApiRequest, NextApiResponse } from "next"
import config from "config"
import { logger } from "shared"

interface JWT {
  username: string
}

const parseJwt = (jwtPayload: string): JWT => {
  const base64Decode = Buffer.from(jwtPayload, "base64")
  return JSON.parse(base64Decode.toString())
}

export default async (request: NextApiRequest, response: NextApiResponse<string>): Promise<void> => {
  const { messageId } = request.query
  const url = `${config.apiUrl}/messages/${messageId}/retry`
  try {
    const tokenPayload = parseJwt(request.cookies[".AUTH"].split(".")[1])
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
