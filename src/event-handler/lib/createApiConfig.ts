import type ApiConfig from "../types/ApiConfig"

export default (): ApiConfig => {
  const { API_URL, API_KEY } = process.env

  if (!API_URL || !API_KEY) {
    throw Error("API_URL and API_KEY environment variables must all be set.")
  }

  return {
    apiUrl: API_URL,
    apiKey: API_KEY
  }
}
