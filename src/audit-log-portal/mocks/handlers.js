const { rest } = require("msw")
const { messages } = require("./data/messages")

const baseApiUrl = "http://localhost:3010"
const maxItemsPerPage = 10

const filterByLastMessage = (messagesToFilter, lastMessageId) => {
  if (lastMessageId) {
    const filterFromIndex = messagesToFilter.findIndex((x) => x.messageId === lastMessageId) + 1
    return messagesToFilter.slice(filterFromIndex, filterFromIndex + maxItemsPerPage)
  }

  return messages.slice(0, maxItemsPerPage)
}
const getMessage = (messageId) => messages.filter((x) => x.messageId === messageId).slice(0, maxItemsPerPage)

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
    result = getMessageByExternalCorrelationId(externalCorrelationId)
  } else {
    result = filterByLastMessage(messages, lastMessageId)
  }

  if (status) {
    result = filterByStatus(result, status, lastMessageId)
  }

  return res(ctx.json(result))
}

const handleRetryMessage = (req, res, ctx) => {
  const { messageId } = req.params
  const message = getMessage(messageId)[0]
  const retryingEvent = {
    category: "information",
    eventType: "Retrying failed message",
    eventSource: "Failed Message",
    timestamp: new Date().toISOString(),
    attributes: {}
  }
  message.status = "Retrying"
  message.lastEventType = retryingEvent.eventType
  message.events.push(retryingEvent)

  return res(ctx.delay(2000), ctx.json({}))
}

module.exports = {
  handlers: [
    rest.get(`${baseApiUrl}/messages`, handleGetMessages),
    rest.get(`${baseApiUrl}/messages/:messageId`, (req, res, ctx) => res(ctx.json(getMessage(req.params.messageId)))),
    rest.get(`${baseApiUrl}/messages/:messageId/events`, (req, res, ctx) =>
      res(ctx.json(getEvents(req.params.messageId)))
    ),
    rest.post(`${baseApiUrl}/messages/:messageId/retry`, handleRetryMessage)
  ]
}
