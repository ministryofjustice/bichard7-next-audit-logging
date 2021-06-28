const { rest } = require("msw")
const { messages } = require("./data/messages")

const baseApiUrl = "http*://*/restapis/*"

const getMessage = (messageId) => messages.filter((x) => x.messageId === messageId)
const getMessageByExternalCorrelationId = (externalCorrelationId) =>
  messages.filter((x) => x.externalCorrelationId === externalCorrelationId)
const getEvents = (messageId) => messages.filter((x) => x.messageId === messageId)[0].events

module.exports = {
  handlers: [
    rest.get(`${baseApiUrl}/messages`, (req, res, ctx) => {
      const externalCorrelationId = req.url.searchParams.get("externalCorrelationId")
      if (externalCorrelationId) {
        return res(ctx.json(getMessageByExternalCorrelationId(externalCorrelationId)))
      }
      return res(ctx.json(messages))
    }),
    rest.get(`${baseApiUrl}/messages/:messageId`, (req, res, ctx) => res(ctx.json(getMessage(req.params.messageId)))),
    rest.get(`${baseApiUrl}/messages/:messageId/events`, (req, res, ctx) =>
      res(ctx.json(getEvents(req.params.messageId)))
    )
  ]
}
