import DynamoDB from "aws-sdk/clients/dynamodb"
import { SecondaryIndex } from "./SecondaryIndex"

const getTableIndexes = (sortKey: string, secondaryIndexes: SecondaryIndex[]): DynamoDB.GlobalSecondaryIndexList => {
  const indexes = secondaryIndexes.map((index) => ({
    IndexName: index.name,
    KeySchema: [
      {
        AttributeName: index.key,
        KeyType: "HASH"
      }
    ],
    Projection: {
      ProjectionType: "ALL"
    },
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    }
  }))

  // Sory key index
  indexes.push({
    IndexName: `${sortKey}Index`,
    KeySchema: [
      {
        AttributeName: "_",
        KeyType: "HASH"
      },
      {
        AttributeName: sortKey,
        KeyType: "RANGE"
      }
    ],
    Projection: {
      ProjectionType: "ALL"
    },
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    }
  })

  return indexes
}

export default getTableIndexes
