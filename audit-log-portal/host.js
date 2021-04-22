const host = require("serverless-http")
const server = require("restana")()
const files = require("serve-static")
const path = require("path")

const app = require("next")({
  dev: false
})

// Verify the required env vars exist
if (!process.env.NEXT_PUBLIC_API_URL) {
  console.error("Missing environment variable NEXT_PUBLIC_API_URL")
  process.exit(1)
}

// Setup the server and which files to host
const nextRequesthost = app.getRequestHandler()

server.use(files(path.join(__dirname, ".next")))
server.use(files(path.join(__dirname, "public")))

server.all("/api/*", nextRequesthost)
server.all("*", nextRequesthost)

module.exports.handler = host(server)
