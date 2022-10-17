import DynamoDB, { DocumentClient } from "aws-sdk/clients/dynamodb"

const getAll = (tableName: string, client: DocumentClient): Promise<DocumentClient.ScanOutput> => {
  return client
    .scan({
      TableName: tableName
    })
    .promise()
}

const clearDynamoTable = async (
  tableName: string,
  keyName: string,
  config?: DynamoDB.ClientConfiguration,
  attempts = 5
) => {
  const dynamoConfig = config ?? {
    endpoint: "http://localhost:8000",
    region: "eu-west-2",
    accessKeyId: "DUMMY",
    secretAccessKey: "DUMMY"
  }
  const service = new DynamoDB(dynamoConfig)
  const client = new DocumentClient({ service })

  const items = await getAll(tableName, client)

  const promises =
    items.Items?.map((item) =>
      client
        .delete({
          TableName: tableName,
          Key: {
            [keyName]: item[keyName]
          }
        })
        .promise()
    ) ?? []

  await Promise.all(promises)

  const remainingItems = await getAll(tableName, client)
  if (remainingItems.Count && remainingItems.Count > 0) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    if (attempts > 0) {
      await clearDynamoTable(tableName, keyName, config, attempts - 1)
    } else {
      throw new Error("Could not delete items from Dynamo table")
    }
  }
}

export default clearDynamoTable
