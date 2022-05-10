import { isError } from "shared-types"
import { compress, decompress } from "./compression"

describe("compression", () => {
  it("should compress and decompress string", async () => {
    const expectedData = "Dummy text".repeat(5000)

    const compressedResult = await compress(expectedData)

    expect(isError(compressedResult)).toBe(false)
    expect(compressedResult).not.toBe(expectedData)
    expect((compressedResult as string).length).toBeLessThan(expectedData.length)

    const decompressedResult = await decompress(compressedResult as string)
    expect(isError(decompressedResult)).toBe(false)
    expect(decompressedResult).toBe(expectedData)
  })

  it("should return undefined when input is empty", async () => {
    const compressedResult = await compress("")

    expect(isError(compressedResult)).toBe(false)
    expect(compressedResult).toBeUndefined()

    const decompressedResult = await decompress(compressedResult as string)
    expect(isError(decompressedResult)).toBe(false)
    expect(decompressedResult).toBeUndefined()
  })

  it("should return undefined when input is undefined", async () => {
    const compressedResult = await compress(undefined as unknown as string)

    expect(isError(compressedResult)).toBe(false)
    expect(compressedResult).toBeUndefined()

    const decompressedResult = await decompress(compressedResult as string)
    expect(isError(decompressedResult)).toBe(false)
    expect(decompressedResult).toBeUndefined()
  })
})
