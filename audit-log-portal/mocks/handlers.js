const { rest } = require("msw")
const { messages } = require("./data/messages")

const baseApiUrl = "http*://*/restapis/*"

module.exports = {
  handlers: [rest.get(`${baseApiUrl}/messages`, (req, res, ctx) => res(ctx.json({ messages })))]
}
