import Pino from "pino"

const logger: Pino.Logger = Pino({
  name: `${process.env.AWS_LAMBDA_FUNCTION_NAME}`,
  timestamp: false,
  messageKey: "message"
})

export default logger
