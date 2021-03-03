import { DynamoDB } from "aws-sdk"
import DynamoDbService from "./services/DynamoDbService"
import testData from "./test-data/test-data.json"

const LOCALSTACK_URL = "http://localhost:4566"

describe("db integration tests", () => {
  let dbService: DynamoDbService
  beforeAll(async () => {
    const config: DynamoDB.Types.ClientConfiguration = {
      region: "eu-west2",
      endpoint: LOCALSTACK_URL
    }
    dbService = new DynamoDbService(config, "test-incoming-message-table")

    const params = {
      TableName: "",
      KeySchema: [
        {
          AttributeName: "messageId",
          KeyType: "HASH"
        },
        {
          AttributeName: "title",
          KeyType: "RANGE"
        }
      ],
      AttributeDefinitions: [
        {
          AttributeName: "messageId",
          AttributeType: "S"
        },
        {
          AttributeName: "title",
          AttributeType: "S"
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      }
    }
    await dbService.createTable(params)
    await dbService.seedTable(testData)
  })

  afterAll(async () => {
    await dbService.deleteTable()
  })

  it("should create and populate a document in dynamodb", async () => {
    const result = await dbService.list()
    expect(JSON.parse(result).length).toBe(2)
  })
})
