import type { AuditLogEvent } from "shared-types"

export default (event: AuditLogEvent): boolean => {
  const { attributes } = event
  const hasCorrectMessageType = attributes["Message Type"] === "SPIResults"
  const hasErrorDetailsAttribute = Object.keys(attributes).some((attributeName) =>
    attributeName.match(/Error.*Details/)
  )

  return hasCorrectMessageType && hasErrorDetailsAttribute
}
