const { rest } = require("msw")
const { messages } = require("./data/messages")

const baseApiUrl = "http*://*/restapis/*"

const filterByLastMessage = (messagesToFilter, lastMessageId) => {
  if (lastMessageId) {
    const filterFromIndex = messagesToFilter.findIndex((x) => x.messageId === lastMessageId) + 1
    return messagesToFilter.slice(filterFromIndex)
  }

  return messages
}
const getMessage = (messageId) => messages.filter((x) => x.messageId === messageId)

const getMessageByExternalCorrelationId = (externalCorrelationId) =>
  messages.filter((x) => x.externalCorrelationId === externalCorrelationId)
const getEvents = (messageId) => messages.filter((x) => x.messageId === messageId)[0].events

const filterByStatus = (messagesToFilter, status, lastMessageId) => {
  let result
  if (status === "Error") {
    result = messagesToFilter.filter((x) => x.status !== "Processing" && x.status !== "Completed")
  }
  result = messagesToFilter.filter((x) => x.status === status)

  return filterByLastMessage(result, lastMessageId)
}

const handleGetMessages = (req, res, ctx) => {
  const externalCorrelationId = req.url.searchParams.get("externalCorrelationId")
  const status = req.url.searchParams.get("status")
  const lastMessageId = req.url.searchParams.get("lastMessageId")
  let result
  if (externalCorrelationId) {
    result = res(ctx.json(getMessageByExternalCorrelationId(externalCorrelationId)))
  } else {
    result = filterByLastMessage(messages, lastMessageId)
  }

  if (status) {
    result = filterByStatus(result, status, lastMessageId)
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
