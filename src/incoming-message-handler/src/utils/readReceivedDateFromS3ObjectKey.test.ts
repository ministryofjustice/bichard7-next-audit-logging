import { isError } from "shared-types"
import readReceivedDateFromS3ObjectKey from "./readReceivedDateFromS3ObjectKey"

describe("readReceivedDateFromS3ObjectKey()", () => {
  it("should return the correct date when a valid object key is given", () => {
    const objectKey = "2021/03/17/10/36/messageId.xml"
    const expectedDate = new Date(2021, 2 /* March */, 17, 10, 36)

    const actualDate = readReceivedDateFromS3ObjectKey(objectKey)
    const actualMonth = actualDate.toLocaleString("default", { month: "long" })

    expect(actualDate.toString()).toBe(expectedDate.toString())
    expect(actualMonth).toBe("March")
  })

  it("should throw an error when the object key is not in the correct format", () => {
    const invalidObjectKey = "InvalidObjectKey"

    let actualError: Error | undefined

    try {
      readReceivedDateFromS3ObjectKey(invalidObjectKey)
    } catch (error) {
      actualError = isError(error) ? error : Error("Error was not an error")
    }

    expect(actualError).toBeDefined()
    expect(actualError?.message).toBe(`The object key "${invalidObjectKey}" is in an invalid format`)
  })
})
