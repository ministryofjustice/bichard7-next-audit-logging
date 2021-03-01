import { DynamoDB } from "aws-sdk"
import { DbConfig, DbResults } from "./types"

const { DocumentClient } = DynamoDB

// eslint-disable-next-line import/prefer-default-export
export class DynamoDbService {
  private dynamoDb: DynamoDB

  private documentClient: DynamoDB.DocumentClient

  constructor(private config: DbConfig, private tableName: string) {
    this.dynamoDb = new DynamoDB({ ...this.config })
    this.documentClient = new DocumentClient({ service: this.dynamoDb })
  }

  async init(params: AWS.DynamoDB.Types.CreateTableInput): Promise<void> {
    const hasTable = await this.hasTable()
    if (!hasTable) {
      this.createTable(params)
    }
  }

  async hasTable(): Promise<boolean | undefined> {
    const tables = await this.dynamoDb.listTables({ Limit: 5 }).promise()
    return tables.TableNames && tables.TableNames.indexOf(this.tableName) >= 0
  }

  async createTable(params: AWS.DynamoDB.Types.CreateTableInput): Promise<DbResults> {
    const { TableName, KeySchema, AttributeDefinitions, ProvisionedThroughput, LocalSecondaryIndexes } = params
    const tableParams = {
      TableName: TableName || this.tableName,
      KeySchema,
      AttributeDefinitions,
      ProvisionedThroughput,
      LocalSecondaryIndexes
    }
    const result = await this.dynamoDb.createTable(tableParams).promise()
    const { data, error } = result.$response
    return { data, error }
  }

  async deleteTable(): Promise<DbResults> {
    const result = await this.dynamoDb.deleteTable({ TableName: this.tableName }).promise()
    const { data, error } = result.$response
    return { data, error }
  }

  async seedTable<T>(data: T[]): Promise<void> {
    const putRequests = data.map((d) => ({
      PutRequest: {
        Item: { ...d }
      }
    }))
    const params = {
      RequestItems: {
        [this.tableName]: putRequests
      }
    }
    await this.documentClient.batchWrite(params).promise()
  }

  async list(): Promise<string> {
    const params = this.getParams()
    const response = await this.documentClient.scan(params).promise()
    return JSON.stringify(response.Items, null, 2)
  }

  async put<T>(item: T): Promise<T> {
    const params = this.getParams({ Item: item })
    await this.documentClient.put(params).promise()
    return item
  }

  async update<T>(item: T): Promise<T> {
    const params = this.getParams({ Item: item })
    await this.documentClient.update(params).promise()
    return item
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getParams(args: any = {}) {
    return { TableName: this.tableName, ...args }
  }
}
