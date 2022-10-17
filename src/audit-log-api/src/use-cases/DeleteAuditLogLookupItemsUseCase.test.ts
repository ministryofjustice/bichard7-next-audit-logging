import { isError } from "shared-types"
import { FakeAuditLogLookupDynamoGateway } from "../test"
import DeleteAuditLogLookupItemsUseCase from "./DeleteAuditLogLookupItemsUseCase"

const fakeAuditLogLookupDynamoGateway = new FakeAuditLogLookupDynamoGateway()
const useCase = new DeleteAuditLogLookupItemsUseCase(fakeAuditLogLookupDynamoGateway)

it("should call deleteByMessageId with the given messageId", async () => {
  const deleteByMessageIdSpy = jest.spyOn(fakeAuditLogLookupDynamoGateway, "deleteByMessageId")

  const messageId = "someMessageId"
  await useCase.call(messageId)

  expect(deleteByMessageIdSpy).toHaveBeenCalledWith("someMessageId")
})

it("should return error when the DynamoDB gateway returns error", async () => {
  const expectedError = new Error("Dummy Error Message")
  fakeAuditLogLookupDynamoGateway.shouldReturnError(expectedError)

  const result = await useCase.call("dummyId")

  expect(isError(result)).toBe(true)

  const actualError = <Error>result
  expect(actualError.message).toBe(expectedError.message)
})
