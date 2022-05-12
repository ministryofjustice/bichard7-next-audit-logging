import type { ReceivedMessage } from "src/entities"
import logBadUnicode from "./logBadUnicode"

describe("logBadUnicode", () => {
  beforeEach(() => {
    jest.spyOn(console, "error")
  })

  it("should log an error if the xml contains an invalid character", () => {
    const receivedMessage = {
      messageXml: "Bad character: \u{10001e}",
      s3Path: "/path/to/file.xml"
    } as ReceivedMessage
    logBadUnicode(receivedMessage)
    expect(console.error).toHaveBeenCalledWith("Bad unicode character received in file: /path/to/file.xml")
  })

  it("should not log an error if the xml does not contain an invalid character", () => {
    logBadUnicode(<ReceivedMessage>{ messageXml: "good message" })
    expect(console.error).not.toHaveBeenCalled()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })
})
