import DynamoDB from "aws-sdk/clients/dynamodb"
import { SecondaryIndex } from "./SecondaryIndex"

const getTableAttributes = (
  keyName: string,
  sortKey: string,
  secondaryIndexes: SecondaryIndex[]
): DynamoDB.AttributeDefinitions => {
  const attributesInIndexes = secondaryIndexes
    .filter((index) => index.key !== keyName && index.key !== sortKey)
    .map((index) => ({
      AttributeName: index.key,
      AttributeType: "S"
    }))

  return [
    {
      AttributeName: keyName,
      AttributeType: "S"
    },
    {
      AttributeName: sortKey,
      AttributeType: "S"
    },
    {
      AttributeName: "_",
      AttributeType: "S"
    },
    ...attributesInIndexes
  ]
}

export default getTableAttributes
