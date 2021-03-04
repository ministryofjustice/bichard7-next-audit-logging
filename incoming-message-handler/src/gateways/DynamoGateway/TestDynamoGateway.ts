import { DocumentClient } from "aws-sdk/clients/dynamodb"
import DynamoGateway from "./DynamoGateway"

export default class TestDynamoGateway extends DynamoGateway {
  getAll(tableName: string): Promise<DocumentClient.ScanOutput> {
    return this.client
      .scan({
        TableName: tableName
      })
      .promise()
  }
}
