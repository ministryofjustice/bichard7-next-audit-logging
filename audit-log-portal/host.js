const host = require("serverless-http")
const server = require("restana")()
const files = require("serve-static")
const path = require("path")
const fs = require("fs")

const app = require("next")({
  dev: false
})

// Create the environment variables file
const envVars = JSON.stringify({
  NEXT_PUBLIC_API_URL=process.env.AUDIT_LOG_API_URL
})

fs.writeFileSync(".env.local", envVars)

// Setup the server and which files to host
const nextRequesthost = app.getRequestHandler()

server.use(files(path.join(__dirname, ".next")))
server.use(files(path.join(__dirname, "public")))

server.all("/api/*", nextRequesthost)
server.all("*", nextRequesthost)

module.exports.handler = host(server)
