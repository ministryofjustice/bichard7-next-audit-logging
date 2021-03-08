import { SQSEvent } from "aws-lambda"
import { isError } from "@handlers/common"
import MqGateway from "./gateways/MqGateway"
import createMqConfig from "./utils/createMqConfig"
import IncomingMessage from "./entities/IncomingMessage"
import IncomingMessageDynamoGateway from "./gateways/IncomingMessageDynamoGateway"
import SendRecordsUseCase from "./use-cases/SendRecordsUseCase"
import PersistMessageUseCase from "./use-cases/PersistMessageUseCase"

const gateway = new MqGateway(createMqConfig())
const sendRecordsUseCase = new SendRecordsUseCase(gateway)

// eslint-disable-next-line import/prefer-default-export
export const sendMessage = async (event: SQSEvent): Promise<void> => {
  const record = event.Records[0].body

  // TODO: Move the config into environment variables.
  const incomingMessageGateway = new IncomingMessageDynamoGateway(
    {
      DYNAMO_URL: "http://localstack_main:4566",
      DYNAMO_REGION: "us-east-1"
    },
    "IncomingMessage"
  )

  // TODO: Merge with message parsing/formatting.
  const incomingMessage = new IncomingMessage(record, new Date())

  const persistMessage = new PersistMessageUseCase(incomingMessageGateway)
  const result = await persistMessage.persist(incomingMessage)

  if (isError(result)) {
    throw result
  }

  // TODO: SendRecords should be handled one at a time.
  await sendRecordsUseCase.sendRecords(event.Records)
}
