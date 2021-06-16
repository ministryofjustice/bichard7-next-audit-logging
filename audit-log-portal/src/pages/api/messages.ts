import config from "config"

export default async (_, response) => {
  const fetchResponse = await fetch(`${config.apiUrl}/messages`)
  const messages = await fetchResponse.json()

  response.status(200).json({ messages })
}
