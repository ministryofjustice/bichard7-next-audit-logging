import decodeBase64 from "./decodeBase64"

test("Decoded string matches expected string", () => {
  const encoded = "SGVsbG8sIFdvcmxkIQ=="
  const decoded = decodeBase64(encoded)

  expect(decoded).toBe("Hello, World!")
})

test("Decoded string with utf8 matches expected string", () => {
  const encoded = "dGhpcyBpcyBhIOKAmHV0Zi044oCZIHN0cmluZw=="
  const decoded = decodeBase64(encoded)

  expect(decoded).toBe("this is a ‘utf-8’ string")
})
