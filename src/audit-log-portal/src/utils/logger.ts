import Pino from "pino"

const logger: Pino.Logger = Pino({
  name: `${process.env.AWS_LAMBDA_FUNCTION_NAME}`,
  timestamp: false,
  messageKey: "message",
  enabled: process.env.NODE_ENV !== "test"
})

export default logger
