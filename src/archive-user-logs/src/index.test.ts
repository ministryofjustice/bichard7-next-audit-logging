/* eslint-disable jest/no-conditional-expect */
import { setEnvironmentVariables } from "shared-testing"
setEnvironmentVariables()
import { uploadToS3 } from "./utils/uploadToS3"
import { default as handler } from "."
import { ZodError } from "zod"

jest.mock("./utils/uploadToS3")

const mockUploadToS3 = uploadToS3 as jest.MockedFunction<typeof uploadToS3>

const originalEnv = process.env

const mockValidInput = {
  awslogs: {
    data: "H4sIAAAAAAAAAzVQTW/CMAz9LzkTKXETt+WGNMZpJ7hNaEpTA9lIWyUp24T47zOgHXx5fh/2u4pIObsj7X4nEkvxstqtPt7W2+1qsxYLMX4PlBi2jW6gqozCumL4PB43aZwn3vjPTLIL/uRSX0sCkoVykZ1jOAyH5OScKUmeS/D01G5LIhdZTD5L+iE/F5J+jNENvVTKVthjVbe21bbtHWvy3GWfwlTCOLyGc6GUxfJdFIrTM45NsyyjPLvY9U4eHpw70M3+i4rYP3LXFxrKXXkVoef4ClG3iLZua9QaEQzwm602ChAbpYw1VqG2FjVo00ANLQCz+KISuLfiIleg0YBqABVCoxf/fbI9iNv+9gfiCTmTYQEAAA=="
  }
}

const mockInvalidInput = {
  awslogs: {
    data: undefined
  }
}

const mockInvalidDataInput = {
  awslogs: {
    data: "{}"
  }
}

const mockInvalidEvent = {
  // missing owner key
  awslogs: {
    data: "H4sIAAAAAAAAAzVQTWvDMAz9K8HnGmw3VuLeCut62im9jTIcR+nc1UmwnbJR+t+ntNtBIKT3xbuxgCnZEx5+JmQb9rI9bD/edk2z3e/Yil3G0z6O80Qfd07IW+8+bewqjgp5xpR5a+nshz5aPieMnObqHT65TY5oA5HRJY7f6OaM3I0h2KHjQug1dLCujDZSm84SJ81tctFP2Y/Dq79kjIlt3lnGMD3tSDTxPPKLDW1nef/ALId2dl+Y2fHhu7vikBfmjfmO7NcA0gDoylQgJYAqlayVkaVQALUQpS61AKk1SCXLWlXKKEUoSpQ9FZRtoAoklErUCgSoWq7+iyP5v62QRT/G4kz4Ygmb2P14/wVoMGPvYQEAAA=="
  }
}

const expectedParsedEvent = {
  messageType: "DATA_MESSAGE",
  owner: "581823340673",
  logGroup: "cjse-bichard7-e2e-test-base-infra-user-service",
  logStream: "ecs-execute-command-00536d637959159da",
  subscriptionFilters: ["temp-test-logs-to-lambda-filter-to-bucket"],
  logEvents: [
    {
      id: "36619665797611662421829140266800454506155612148272922624",
      timestamp: 1642082606281,
      message: "2"
    }
  ]
}

describe("GIVEN Arhive User Logs Lambda", () => {
  beforeEach(() => {
    jest.resetModules() // reset the cache of all required modules
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      ARCHIVE_USER_LOGS_BUCKET: "test-bucket",
      REGION: "test-region"
    }
  })

  afterEach(() => {
    process.env = originalEnv // reset env vars
  })

  describe("WHEN passed valid input", () => {
    it("THEN write to s3", async () => {
      mockUploadToS3.mockImplementation(() => Promise.resolve())
      await handler(mockValidInput)
      expect(mockUploadToS3).toHaveBeenCalledTimes(1)
      expect(mockUploadToS3).toHaveBeenCalledWith(expectedParsedEvent, "test-bucket", expect.anything())
    })
  })

  describe("WHEN passed invalid input", () => {
    it("THEN throw a ZodError", async () => {
      mockUploadToS3.mockImplementation(() => Promise.resolve())
      expect.assertions(3)

      try {
        await handler(mockInvalidInput)
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError)
        expect((error as ZodError).issues[0].code).toBe("invalid_type")
        // @ts-ignore
        expect((error as ZodError).issues[0].received).toBe("undefined")
      }
    })

    it("AND the data is incorrectly base64 encoded THEN throw an Error", async () => {
      mockUploadToS3.mockImplementation(() => Promise.resolve())
      expect.assertions(2)

      try {
        await handler(mockInvalidDataInput)
      } catch (error) {
        expect((error as any).code).toBe("Z_BUF_ERROR") // node standard library error and jest have differing globals so it's hard to expect().toBeInstanceOf(Error)
        expect((error as Error).message).toBe("unexpected end of file")
      }
    })

    it("AND the data is properly base64 encoded but not with the expected shape ValidEvent THEN throw a ZodError", async () => {
      mockUploadToS3.mockImplementation(() => Promise.resolve())
      expect.assertions(3)

      try {
        await handler(mockInvalidEvent)
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError)
        expect((error as ZodError).issues[0].path[0]).toBe("owner")
        // @ts-ignore
        expect((error as ZodError).issues[0].received).toBe("undefined")
      }
    })

    it("AND the upload to S3 fails THEN throw an Error", async () => {
      mockUploadToS3.mockImplementation(() => Promise.reject(Error("Mock S3 Error")))
      expect.assertions(2)

      try {
        await handler(mockValidInput)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe("Mock S3 Error")
      }
    })
  })
})
