import { SQSEvent } from "aws-lambda"
import { isError } from "@handlers/common"
import { createDynamoDbConfig, createMqConfig } from "./types"
import MqGateway from "./gateways/MqGateway"
import IncomingMessage from "./entities/IncomingMessage"
import IncomingMessageDynamoGateway from "./gateways/IncomingMessageDynamoGateway"
import SendRecordsUseCase from "./use-cases/SendRecordsUseCase"
import PersistMessageUseCase from "./use-cases/PersistMessageUseCase"

const gateway = new MqGateway(createMqConfig())
const sendRecordsUseCase = new SendRecordsUseCase(gateway)

// TODO: Move the config into environment variables.
const incomingMessageGateway = new IncomingMessageDynamoGateway(createDynamoDbConfig(), "IncomingMessage")
const persistMessage = new PersistMessageUseCase(incomingMessageGateway)

// eslint-disable-next-line import/prefer-default-export
export const sendMessage = async (event: SQSEvent): Promise<void> => {
  const record = event.Records[0].body

  // TODO: Merge with message parsing/formatting.
  const incomingMessage = new IncomingMessage(record, new Date())
  const result = await persistMessage.persist(incomingMessage)

  if (isError(result)) {
    throw result
  }

  // TODO: SendRecords should be handled one at a time.
  await sendRecordsUseCase.sendRecords(event.Records)
}
