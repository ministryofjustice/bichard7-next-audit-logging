/* eslint-disable @typescript-eslint/no-explicit-any */

import { AuditLogApiClient, logger, TestDynamoGateway } from "shared"
import type { ApiClient } from "shared-types"
import "shared-testing"
import { execute } from "lambda-local"
import sanitiseOldMessages from "./index"

logger.level = "debug"

const lambdaEnvironment = {
  API_URL: "http://localhost:3010",
  API_KEY: "apiKey",
  DB_HOST: "localhost",
  DB_USER: "bichard",
  DB_PASSWORD: "password",
  DB_NAME: "bichard"
}

const executeLambda = (environment?: any): Promise<unknown> => {
  return execute({
    event: {},
    lambdaFunc: { handler: sanitiseOldMessages },
    region: "eu-west-2",
    timeoutMs: 60 * 1_000,
    environment: environment ?? lambdaEnvironment
  })
}

describe("Sanitise Old Messages e2e", () => {
  let dynamo: any
  let api: ApiClient

  beforeAll(() => {
    dynamo = new TestDynamoGateway({
      DYNAMO_URL: "http://localhost:8000",
      DYNAMO_REGION: "eu-west-2",
      TABLE_NAME: "auditLogTable",
      AWS_ACCESS_KEY_ID: "DUMMY",
      AWS_SECRET_ACCESS_KEY: "DUMMY"
    })

    api = new AuditLogApiClient("http://localhost:3010", "apiKey")
  })

  beforeEach(async () => {
    await dynamo.deleteAll("auditLogTable", "messageId")
  })

  it("should sanitise a single message older than the configured threshold", async () => {
    await executeLambda()
    // skeleton 💀
    const messageResult = await api.getMessage("message_1")
    expect(messageResult).toNotBeError()
  })
})
