import DynamoDB from "aws-sdk/clients/dynamodb"
import AuditLog from "src/AuditLog"
import AuditLogPagination from "./AuditLogPagination"

describe("createDefaultPagination", () => {
  it("returns pagination with limit only when lastMessage is not provided", () => {
    const expectedLimit = 10
    const auditLogPagination = new AuditLogPagination(expectedLimit)
    const actualPagination = auditLogPagination.createDefaultPagination()

    expect(actualPagination).toBeDefined()
    expect(actualPagination.limit).toBe(expectedLimit)
    expect(actualPagination.lastItemKey).toBeUndefined()
  })

  it("returns pagination with limit and lastItemKey when lastMessage is provided", () => {
    const message = new AuditLog("External correlation id", new Date(), "Xml")
    const expectedLimit = 10
    const expectedLastItemKey = {
      messageId: message.messageId,
      _: "_",
      receivedDate: message.receivedDate
    }

    const auditLogPagination = new AuditLogPagination(expectedLimit)
    const actualPagination = auditLogPagination.createDefaultPagination(message)

    expect(actualPagination).toBeDefined()
    expect(actualPagination.limit).toBe(expectedLimit)
    expect(actualPagination.lastItemKey).toBeDefined()

    const actualLastItemKey: DynamoDB.DocumentClient.Key = actualPagination.lastItemKey!
    expect(Object.keys(actualLastItemKey)).toHaveLength(3)
    expect(actualLastItemKey.messageId).toBe(expectedLastItemKey.messageId)
    expect(actualLastItemKey._).toBe(expectedLastItemKey._)
    expect(actualLastItemKey.receivedDate).toBe(expectedLastItemKey.receivedDate)
  })
})

describe("createStatusPagination", () => {
  it("returns pagination with limit only when lastMessage is not provided", () => {
    const expectedLimit = 10
    const auditLogPagination = new AuditLogPagination(expectedLimit)
    const actualPagination = auditLogPagination.createStatusPagination()

    expect(actualPagination).toBeDefined()
    expect(actualPagination.limit).toBe(expectedLimit)
    expect(actualPagination.lastItemKey).toBeUndefined()
  })

  it("returns pagination with limit and lastItemKey when lastMessage is provided", () => {
    const message = new AuditLog("External correlation id", new Date(), "Xml")
    const expectedLimit = 10
    const expectedLastItemKey = {
      messageId: message.messageId,
      status: message.status,
      receivedDate: message.receivedDate
    }

    const auditLogPagination = new AuditLogPagination(expectedLimit)
    const actualPagination = auditLogPagination.createStatusPagination(message)

    expect(actualPagination).toBeDefined()
    expect(actualPagination.limit).toBe(expectedLimit)
    expect(actualPagination.lastItemKey).toBeDefined()

    const actualLastItemKey: DynamoDB.DocumentClient.Key = actualPagination.lastItemKey!
    expect(Object.keys(actualLastItemKey)).toHaveLength(3)
    expect(actualLastItemKey.messageId).toBe(expectedLastItemKey.messageId)
    expect(actualLastItemKey.status).toBe(expectedLastItemKey.status)
    expect(actualLastItemKey.receivedDate).toBe(expectedLastItemKey.receivedDate)
  })
})
