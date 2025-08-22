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

  beforeEach(() => {
    mockGetParameter.mockReset()
  })

  it("fetches API_KEY from SSM", async () => {
    const ssm = new SSM()
    mockGetParameter.mockReturnValue({
      promise: () => Promise.resolve({ Parameter: { Value: "fakeApiKey" } })
    })

    const result = await getSSMParameter(ssm, paramString, paramDescription)

    expect(result).toBe("fakeApiKey")
    expect(ssm.getParameter).toHaveBeenCalledWith({
      Name: paramString,
      WithDecryption: true
    })
  })

  it("throws if SSM rejects with an error", async () => {
    const ssm = new SSM()
    mockGetParameter.mockReturnValue({
      promise: () => Promise.reject(new Error("SSM error"))
    })

    await expect(getSSMParameter(ssm, paramString, paramDescription)).rejects.toThrow("SSM error")
  })

  it("throws if SSM parameter value is missing", async () => {
    const ssm = new SSM()
    mockGetParameter.mockReturnValue({
      promise: () => Promise.resolve({ Parameter: { Value: undefined } })
    })

    await expect(getSSMParameter(ssm, paramString, paramDescription)).rejects.toThrow(
      "Couldn't retrieve API key from SSM"
    )
  })
})
