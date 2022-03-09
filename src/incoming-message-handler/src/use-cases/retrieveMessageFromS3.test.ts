import "shared-testing"
import { FakeS3Gateway } from "shared-testing"
import type { S3PutObjectEvent } from "shared-types"
import retrieveMessageFromS3 from "./retrieveMessageFromS3"
import { v4 as uuid } from "uuid"
import type { ReceivedMessage } from "../entities"
import type { ApplicationError } from "shared-types"
import type { ValidationResult } from "src/handlers/storeMessage"

const expectedExternalCorrelationId = uuid()
const externalId = uuid()
const expectedCaseId = "41BP0510007"
const originalXml = `
  <?xml version="1.0" encoding="UTF-8"?>
  <RouteData xmlns="http://schemas.cjse.gov.uk/messages/deliver/2006-05" xmlns:ex="http://schemas.cjse.gov.uk/messages/exception/2006-06" xmlns:mf="http://schemas.cjse.gov.uk/messages/format/2006-05" xmlns:mm="http://schemas.cjse.gov.uk/messages/metadata/2006-05" xmlns:msg="http://schemas.cjse.gov.uk/messages/messaging/2006-05" xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <RequestFromSystem>
      <CorrelationID>
        ${expectedExternalCorrelationId}
      </CorrelationID>
    </RequestFromSystem>
    <DataStream>
      <DataStreamContent>
        &lt;DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow="ResultedCasesForThePolice" Interface="LibraStandardProsecutorPolice" SchemaVersion="0.6g"&gt;
          &lt;DC:Session&gt;
            &lt;DC:Case&gt;
              &lt;DC:PTIURN&gt;
                ${expectedCaseId}
              &lt;/DC:PTIURN&gt;
            &lt;/DC:Case&gt;
          &lt;/DC:Session&gt;
        &lt;/DC:ResultedCaseMessage&gt;
      </DataStreamContent>
    </DataStream>
  </RouteData>
`

const s3Gateway = new FakeS3Gateway()

it("should return the received message when object exists in S3", async () => {
  const key = `2022/02/03/14/10/${externalId}.xml`
  const executionId = "DUMMY_EXECUTION_ID"
  const input = {
    id: executionId,
    detail: {
      requestParameters: {
        bucketName: "DUMMY_BUCKET",
        key
      }
    }
  } as S3PutObjectEvent

  s3Gateway.reset({
    [key]: originalXml
  })
  const receivedMessage = await retrieveMessageFromS3(input, s3Gateway)
  expect(receivedMessage).toNotBeError()

  const {
    externalId: actualExternalId,
    s3Path,
    receivedDate,
    messageXml,
    stepExecutionId
  } = receivedMessage as ReceivedMessage

  expect(actualExternalId).toBe(externalId)
  expect(s3Path).toBe(key)
  expect(receivedDate).toBe("2022-02-03T14:10:00.000Z")
  expect(stepExecutionId).toBe(executionId)
  expect(messageXml).toBeDefined()
})

it("should return error when S3 key is invalid", async () => {
  const key = `2022/02/03/14/INVALID/${externalId}.xml`
  const executionId = "DUMMY_EXECUTION_ID"
  const input = {
    id: executionId,
    detail: {
      requestParameters: {
        bucketName: "DUMMY_BUCKET",
        key
      }
    }
  } as S3PutObjectEvent

  s3Gateway.reset({
    [key]: originalXml
  })
  const receivedMessage = await retrieveMessageFromS3(input, s3Gateway)
  expect(receivedMessage).toNotBeError()

  const { isValid, message: validationMessage } = receivedMessage as ValidationResult
  expect(isValid).toBe(false)
  expect(validationMessage).toBe("Key path has non-numerical parts.")
})

it("should return error when S3 gateway returns error", async () => {
  const key = `2022/02/03/14/10/${externalId}.xml`
  const executionId = "DUMMY_EXECUTION_ID"
  const input = {
    id: executionId,
    detail: {
      requestParameters: {
        bucketName: "DUMMY_BUCKET",
        key
      }
    }
  } as S3PutObjectEvent

  const expectedError = new Error("Dummy error")
  s3Gateway.shouldReturnError(expectedError)
  const receivedMessage = await retrieveMessageFromS3(input, s3Gateway)
  expect(receivedMessage).toBeError("Error while getting the message from S3")

  const { originalError } = receivedMessage as ApplicationError
  expect(originalError).toBeError(expectedError.message)
})
