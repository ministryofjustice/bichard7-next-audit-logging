import type { ValidationResult } from "../handlers/storeMessage"

const createInvalidResult = (message: string): ValidationResult => {
  return {
    isValid: false,
    message
  }
}

const validateS3Key = (key: string): ValidationResult => {
  if (!key) {
    return createInvalidResult("Key is empty.")
  }

  if (key.endsWith("/")) {
    return createInvalidResult("Key path is a folder.")
  }

  const keyParts = key.split("/")

  if (keyParts.length !== 6) {
    return createInvalidResult("Key path must have 6 parts.")
  }

  for (let i = 0; i < keyParts.length - 1; i++) {
    const number = parseInt(keyParts[i], 10)
    if (Number.isNaN(number)) {
      return createInvalidResult("Key path has non-numerical parts.")
    }
  }

  return { isValid: true }
}

export default validateS3Key
