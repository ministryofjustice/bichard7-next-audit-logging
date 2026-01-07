/* eslint-disable import/no-extraneous-dependencies */
import type { WrapperOptions } from "convert-lambda-to-express"
import { wrapLambda } from "convert-lambda-to-express"
import type { RequestHandler } from "express"
import express from "express"
import createAuditLog from "./handlers/createAuditLog"
import createAuditLogEvents from "./handlers/createAuditLogEvents"
import createAuditLogUserEvents from "./handlers/createAuditLogUserEvents"
import getMessages from "./handlers/getMessages"
import retryMessage from "./handlers/retryMessage"
import sanitiseMessage from "./handlers/sanitiseMessage"
import type { APIGatewayProxyWithCognitoAuthorizerHandler } from "aws-lambda"

const port = process.env.PORT ? Number(process.env.PORT) : 7000

const options: WrapperOptions = {
  region: "eu-west-2", // sets AWS_REGION for sdk calls in handler
  timeoutInSeconds: 30 // sets actual timeout for handler
}

const route = (handler: APIGatewayProxyWithCognitoAuthorizerHandler, opts: WrapperOptions = options): RequestHandler =>
  wrapLambda(handler, opts) as unknown as RequestHandler

const app = express()
app.use(
  express.json({
    strict: false, // accept anything JSON.parse will accept
    type: () => true // accept any type
  })
)
// API gateway defaults everything with no
// explicit Content-Type header to application/json
// Above config does something similar.

// getMessages:
//   handler: src/audit-log-api/handlers/getMessages.default
//   events:
//     - httpApi:
//         path: /messages
//         method: get
app.get("/messages", route(getMessages, options))

// getMessage:
//   handler: src/audit-log-api/handlers/getMessages.default
//   events:
//     - httpApi:
//         path: /messages/{messageId}
//         method: get
app.get("/messages/:messageId", route(getMessages, options))

// createAuditLog:
//   handler: src/audit-log-api/handlers/createAuditLog.default
//   events:
//     - httpApi:
//         path: /messages
//         method: post
app.post("/messages", route(createAuditLog, options))

// createAuditLogEvents:
//   handler: src/audit-log-api/handlers/createAuditLogEvents.default
//   events:
//     - httpApi:
//         path: /messages/{messageId}/events
//         method: post
app.post("/messages/:messageId/events", route(createAuditLogEvents, options))

// retryMessage:
//   handler: src/audit-log-api/handlers/retryMessage.default
//   events:
//     - httpApi:
//         path: /messages/{messageId}/retry
//         method: post
app.post("/messages/:messageId/retry", route(retryMessage, options))

// sanitiseMessage:
//   handler: src/audit-log-api/handlers/sanitiseMessage.default
//   events:
//     - httpApi:
//         path: /messages/{messageId}/sanitise
//         method: post
app.post("/messages/:messageId/sanitise", route(sanitiseMessage, options))

// createAuditLogUserEvents:
//   handler: src/audit-log-api/handlers/createAuditLogUserEvents.default
//   events:
//     - httpApi:
//         path: /users/{userName}/events
//         method: post
app.post("/users/:userName/events", route(createAuditLogUserEvents, options))

app.get("/health", (_, res) => {
  res.status(204).send()
})

app.listen(port, () => {
  console.log(`Audit log API listening on port ${port}`)
})
