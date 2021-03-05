import { isError, PromiseResult } from "@handlers/common"
import { DynamoDbConfig } from "src/types"
import IncomingMessage from "src/entities/IncomingMessage"
import DynamoGateway from "gateways/DynamoGateway"

export default class IncomingMessageDynamoGateway extends DynamoGateway {
  constructor(config: DynamoDbConfig, private readonly tableName: string) {
    super(config)
  }

  async create(message: IncomingMessage): PromiseResult<IncomingMessage> {
    const result = await this.insertOne(this.tableName, message, "messageId")

    if (isError(result)) {
      return result
    }

    return message
  }
}
