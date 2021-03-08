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

  async deleteAll(tableName: string, keyName: string): Promise<void> {
    const items = await this.getAll(tableName)

    const promises = items.Items.map((item) =>
      this.client
        .delete({
          TableName: tableName,
          Key: {
            [keyName]: item[keyName]
          }
        })
        .promise()
    )

    await Promise.all(promises)

    const remainingItems = await this.getAll(tableName)
    if (remainingItems.Count > 0) {
      throw new Error(`Failed to delete all items! Remaining Items: ${remainingItems.Count}`)
    }
  }
}
