export type ApiConfig = {
  API_URL: string
  API_KEY: string
}

export type SanitiseOldMessagesConfig = {
  MESSAGE_FETCH_BATCH_NUM: number
}

export const getSanitiseConfig = (): SanitiseOldMessagesConfig => {
  const { SANITISE_AFTER_DAYS, CHECK_FREQUENCY_DAYS, MESSAGE_FETCH_BATCH_NUM } = process.env

  if (!SANITISE_AFTER_DAYS) {
    throw Error("SANITISE_AFTER_DAYS environment variable must have value.")
  }

  if (!CHECK_FREQUENCY_DAYS) {
    throw Error("CHECK_FREQUENCY_DAYS environment variable must have value.")
  }

  return {
    MESSAGE_FETCH_BATCH_NUM: MESSAGE_FETCH_BATCH_NUM ? parseInt(MESSAGE_FETCH_BATCH_NUM, 10) : 100
  }
}

export const getApiConfig = (): ApiConfig => {
  const { API_URL, API_KEY } = process.env

  if (!API_URL) {
    throw Error("API_URL environment variable must have value.")
  }

  if (!API_KEY) {
    throw Error("API_KEY environment variable must have value.")
  }

  return {
    API_URL,
    API_KEY
  } as ApiConfig
}
