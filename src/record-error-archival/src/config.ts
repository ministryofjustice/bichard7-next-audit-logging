if (!process.env.API_URL) {
  throw new Error("API_URL environment variable is not set")
}
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set")
}
if (!process.env.DB_HOST) {
  throw new Error("DB_HOST environment variable is not set")
}
if (!process.env.DB_USER) {
  throw new Error("DB_USER environment variable is not set")
}
if (!process.env.DB_PASSWORD) {
  throw new Error("DB_PASSWORD environment variable is not set")
}
if (!process.env.DB_NAME) {
  throw new Error("DB_NAME environment variable is not set")
}

export default {
  apiUrl: process.env.API_URL,
  apiKey: process.env.API_KEY,
  dbHost: process.env.DB_HOST,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME,
  dbSchema: process.env.DB_SCHEMA || "br7own"
}
