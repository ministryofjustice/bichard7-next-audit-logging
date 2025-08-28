import { SSM } from "aws-sdk"
import getSSMParameter from "./getSSMParameter"

const mockGetParameter = jest.fn()

jest.mock("aws-sdk", () => {
  return {
    SSM: jest.fn().mockImplementation(() => ({
      getParameter: mockGetParameter
    }))
  }
})

describe("getSSMParameter", () => {
  const paramString = "API_KEY_ARN"
  const paramDescription = "API key"
  const ssm = new SSM()

  beforeEach(() => {
    mockGetParameter.mockReset()
  })

  it("fetches API_KEY from SSM", async () => {
    mockGetParameter.mockReturnValue({
      promise: () => Promise.resolve({ Parameter: { Value: "fakeApiKey" } })
    })

    const result = await getSSMParameter(ssm, paramString, paramDescription)

    expect(result.value).toBe("fakeApiKey")
    expect(ssm.getParameter).toHaveBeenCalledWith({
      Name: paramString,
      WithDecryption: true
    })
  })

  it("throws if SSM rejects with an error", async () => {
    mockGetParameter.mockReturnValue({
      promise: () => Promise.reject(new Error("SSM error"))
    })

    const result = await getSSMParameter(ssm, paramString, paramDescription)

    expect(result.error?.message).toBe("SSM error")
  })

  it("throws if SSM parameter value is missing", async () => {
    mockGetParameter.mockReturnValue({
      promise: () => Promise.resolve({ Parameter: { Value: undefined } })
    })

    const result = await getSSMParameter(ssm, paramString, paramDescription)

    expect(result.error?.message).toBe("Couldn't retrieve API key from SSM")
  })
})
