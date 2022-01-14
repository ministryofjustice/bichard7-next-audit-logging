import validateS3Key from "./validateS3Key"

describe("validateS3Key", () => {
  it("should return valid result when key is valid", () => {
    const result = validateS3Key("2021/06/15/09/10/file.xml")

    expect(result).toBeDefined()
    expect(result.isValid).toBe(true)
  })

  it("should return invalid result when key is empty", () => {
    const result = validateS3Key("")

    expect(result).toBeDefined()
    expect(result.isValid).toBe(false)
    expect(result.message).toBe("Key is empty.")
  })

  it("should return invalid result when key path does not have the file name", () => {
    const result = validateS3Key("2021/06/15/09/10/")

    expect(result).toBeDefined()
    expect(result.isValid).toBe(false)
    expect(result.message).toBe("Key path is a folder.")
  })

  it("should return invalid result when key path has more than 6 parts", () => {
    const result = validateS3Key("2021/06/15/09/10/12/file.xml")

    expect(result).toBeDefined()
    expect(result.isValid).toBe(false)
    expect(result.message).toBe("Key path must have 6 parts.")
  })

  it("should return invalid result when key path has non-numerical parts", () => {
    const result = validateS3Key("2021/a/15/09/10/file.xml")

    expect(result).toBeDefined()
    expect(result.isValid).toBe(false)
    expect(result.message).toBe("Key path has non-numerical parts.")
  })
})
