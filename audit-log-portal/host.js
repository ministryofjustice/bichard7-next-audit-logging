const host = require("serverless-http")
const server = require("restana")()
const files = require("serve-static")
const path = require("path")

const app = require("next")({
  dev: false
})

const nextRequesthost = app.getRequestHandler()

server.use(files(path.join(__dirname, ".next")))
server.use(files(path.join(__dirname, "public")))

server.all("/api/*", nextRequesthost)
server.all("*", nextRequesthost)

module.exports.handler = host(server)
