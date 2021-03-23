import { isError, PromiseResult } from "@handlers/common"
import { DynamoDbConfig } from "src/configs"
import { AuditLog, Message } from "src/entities"
import DynamoGateway from "src/gateways/DynamoGateway"

export default class AuditLogDynamoGateway extends DynamoGateway {
  constructor(config: DynamoDbConfig, private readonly tableName: string) {
    super(config)
  }

  async create(message: AuditLog): PromiseResult<AuditLog> {
    const result = await this.insertOne(this.tableName, message, "messageId")

    if (isError(result)) {
      return result
    }

    return message
  }

  async fetchMany(limit = 10): PromiseResult<Message[]> {
    const result = await this.getMany(this.tableName, limit)

    if (isError(result)) {
      return result
    }

    return <Message[]>result.Items
  }
}
