if (!process.env.API_URL) {
  throw new Error("API_URL environment variable is not set")
}
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set")
}

export default {
  apiUrl: process.env.API_URL,
  apiKey: process.env.API_KEY,
  initialRetryDelay: process.env.INITIAL_RETRY_DELAY ? parseInt(process.env.INITIAL_RETRY_DELAY) : 1800,
  retryDelay: process.env.RETRY_DELAY ? parseInt(process.env.RETRY_DELAY) : 86400,
  maxRetryAttempts: process.env.MAX_RETRY_ATTEMPTS ? parseInt(process.env.MAX_RETRY_ATTEMPTS) : 3,
  errorsToRetry: process.env.ERRORS_TO_RETRY ? parseInt(process.env.ERRORS_TO_RETRY) : 10
}
