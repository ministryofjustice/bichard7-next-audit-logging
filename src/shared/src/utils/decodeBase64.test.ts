import decodeBase64 from "./decodeBase64"

test("Decoded string matches expected string", () => {
  const encoded = "SGVsbG8sIFdvcmxkIQ=="
  const decoded = decodeBase64(encoded)

  expect(decoded).toBe("Hello, World!")
})
