import type { DynamoDbConfig } from "../gateways/dynamo"

const auditLogDynamoConfig: DynamoDbConfig = {
  endpoint: "http://localhost:8000",
  region: "eu-west-2",
  auditLogTableName: "auditLogTable",
  lookupTableName: "auditLogLookupTable",
  accessKeyId: "DUMMY",
  secretAccessKey: "DUMMY"
}

export default auditLogDynamoConfig
