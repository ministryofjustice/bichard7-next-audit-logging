import "src/shared/testing"
import { isError } from "src/shared/types"
import { compress, decompress } from "./compression"

describe("compression", () => {
  it("should compress and decompress string", async () => {
    const expectedData = "Dummy text".repeat(5000)

    const compressedResult = await compress(expectedData)

    expect(compressedResult).toNotBeError()
    expect(compressedResult).not.toBe(expectedData)
    expect((compressedResult as string).length).toBeLessThan(expectedData.length)

    const decompressedResult = await decompress(compressedResult as string)
    expect(decompressedResult).toNotBeError()
    expect(decompressedResult).toBe(expectedData)
  })

  it("should return empty string when input is empty", async () => {
    const compressedResult = await compress("")

    expect(isError(compressedResult)).toBe(false)
    expect(compressedResult).toBe("")

    const decompressedResult = await decompress(compressedResult as string)
    expect(decompressedResult).toNotBeError()
    expect(decompressedResult).toBe("")
  })
})
