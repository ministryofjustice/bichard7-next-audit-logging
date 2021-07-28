export default function getApiUrl(): string {
  const { API_URL } = process.env

  if (!API_URL) {
    throw Error("API_URL environment variable must have value.")
  }

  return API_URL
}
