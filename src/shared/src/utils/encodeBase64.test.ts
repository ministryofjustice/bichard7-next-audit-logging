import encodeBase64 from "./encodeBase64"

test("encoded string matches expected string", () => {
  const value = "Hello, World!"
  const encoded = encodeBase64(value)

  expect(encoded).toBe("SGVsbG8sIFdvcmxkIQ==")
})
