import type DynamoDbConfig from "./DynamoDbConfig"
import IndexSearcher from "./IndexSearcher"
import TestDynamoGateway from "./TestDynamoGateway"

interface TestRecord {
  id: string
  someOtherValue: string
  someOtherValue2: string
}

const config: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:4566",
  DYNAMO_REGION: "us-east-1",
  AUDIT_LOG_TABLE_NAME: "SearcherTesting"
}

const gateway = new TestDynamoGateway(config)
const partitionKey = "id"
const indexName = "someOtherValueSecondaryIndex"
const hashKey = "someOtherValue"
const hashKeyValue = "Dummy value"
const rangeKey = "someOtherValue2"

beforeAll(async () => {
  const options = {
    keyName: partitionKey,
    sortKey: "someOtherValue",
    secondaryIndexes: [
      {
        name: indexName,
        hashKey,
        rangeKey
      }
    ],
    skipIfExists: true
  }

  await gateway.createTable(config.AUDIT_LOG_TABLE_NAME, options)

  await gateway.deleteAll(config.AUDIT_LOG_TABLE_NAME, "id")

  await Promise.allSettled(
    [...Array(15).keys()].map(async (i: number) => {
      const index = i + 10
      const record = {
        id: `Record ${index}`,
        someOtherValue: hashKeyValue,
        someOtherValue2: `Value ${index}`
      }

      await gateway.insertOne(config.AUDIT_LOG_TABLE_NAME, record, "id")
    })
  )
})

it("should return first 3 records when last record is not provided in the pagination", async () => {
  const result = await new IndexSearcher<TestRecord[]>(gateway, config.AUDIT_LOG_TABLE_NAME, partitionKey)
    .useIndex(indexName)
    .setIndexKeys(hashKey, hashKeyValue, rangeKey)
    .paginate(3)
    .execute()

  expect(result).toBeDefined()
  const records = result as TestRecord[]
  expect(records).toHaveLength(3)
  expect(records[0].id).toBe("Record 24")
  expect(records[1].id).toBe("Record 23")
  expect(records[2].id).toBe("Record 22")
})

it("should return last 3 records when last record is provided in the pagination", async () => {
  const lastRecord: TestRecord = {
    id: `Record 13`,
    someOtherValue: hashKeyValue,
    someOtherValue2: `Value 13`
  }

  const result = await new IndexSearcher<TestRecord[]>(gateway, config.AUDIT_LOG_TABLE_NAME, partitionKey)
    .useIndex(indexName)
    .setIndexKeys(hashKey, hashKeyValue, rangeKey)
    .paginate(10, lastRecord)
    .execute()

  expect(result).toBeDefined()
  const records = result as TestRecord[]
  expect(records).toHaveLength(3)
  expect(records[0].id).toBe("Record 12")
  expect(records[1].id).toBe("Record 11")
  expect(records[2].id).toBe("Record 10")
})

it("should return records in ascending order when pagination is set to order ascending", async () => {
  const result = await new IndexSearcher<TestRecord[]>(gateway, config.AUDIT_LOG_TABLE_NAME, partitionKey)
    .useIndex(indexName)
    .setIndexKeys(hashKey, hashKeyValue, rangeKey)
    .paginate(3, null, true)
    .execute()

  expect(result).toBeDefined()
  const records = result as TestRecord[]
  expect(records).toHaveLength(3)
  expect(records[0].id).toBe("Record 10")
  expect(records[1].id).toBe("Record 11")
  expect(records[2].id).toBe("Record 12")
})
