import type { SSMClient } from "@aws-sdk/client-ssm"
import getConfigValue from "src/shared/utils/getConfigValue"

describe("getConfigValue", () => {
  const send = jest.fn()
  const ssmMock: jest.Mocked<Pick<SSMClient, "send">> = {
    send: send
  }
  const ssm = ssmMock as unknown as SSMClient

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should return the default value when rawValue is undefined", async () => {
    const result = await getConfigValue(ssm, undefined, "expected")

    expect(result).toBe("expected")
  })

  it("should return the raw value if it is not an SSM arn", async () => {
    const result = await getConfigValue(ssm, "plain_text_value", "expected")

    expect(result).toBe("plain_text_value")
  })

  it("should return the value from SSM if an SSM arn is specified", async () => {
    send.mockResolvedValueOnce({
      Parameter: { Value: "secret-value" }
    })

    const result = await getConfigValue(ssm, "arn:aws:ssm:example", "defaultValue")

    expect(result).toBe("secret-value")
  })

  it("should throw error if SSM response could not be read", async () => {
    send.mockResolvedValueOnce({ Parameter: undefined })

    const lambda = () => getConfigValue(ssm, "arn:aws:ssm:bad_arn", "defaultValue")

    await expect(lambda).rejects.toThrow("Failed to read parameter from SSM")
  })
})
