const { rest } = require("msw")
const { messages } = require("./data/messages")

const baseApiUrl = "http*://*/restapis/*"

const getMessage = (messageId) => messages.filter((x) => x.messageId === messageId)

const getMessageByExternalCorrelationId = (externalCorrelationId) =>
  messages.filter((x) => x.externalCorrelationId === externalCorrelationId)
const getEvents = (messageId) => messages.filter((x) => x.messageId === messageId)[0].events

const filterByStatus = (messagesToFilter, status) => {
  if (status === "Error") {
    return messagesToFilter.filter((x) => x.status !== "Processing" && x.status !== "Completed")
  }
  return messagesToFilter.filter((x) => x.status === status)
}

const handleGetMessages = (req, res, ctx) => {
  const externalCorrelationId = req.url.searchParams.get("externalCorrelationId")
  const status = req.url.searchParams.get("status")
  let result
  if (externalCorrelationId) {
    result = res(ctx.json(getMessageByExternalCorrelationId(externalCorrelationId)))
  } else {
    result = messages
  }

  if (status) {
    result = filterByStatus(result, status)
  }

  return res(ctx.json(result))
}

module.exports = {
  handlers: [
    rest.get(`${baseApiUrl}/messages`, handleGetMessages),
    rest.get(`${baseApiUrl}/messages/:messageId`, (req, res, ctx) => res(ctx.json(getMessage(req.params.messageId)))),
    rest.get(`${baseApiUrl}/messages/:messageId/events`, (req, res, ctx) =>
      res(ctx.json(getEvents(req.params.messageId)))
    )
  ]
}
