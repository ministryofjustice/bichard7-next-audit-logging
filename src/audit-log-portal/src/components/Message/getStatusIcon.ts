import type { ComponentType } from "react"
import ErrorIcon from "icons/ErrorIcon"
import SuccessIcon from "icons/SuccessIcon"
import ProcessingIcon from "icons/ProcessingIcon"
import { AuditLogStatus } from "shared-types"

export default function getStatusIcon(status: string): ComponentType {
  switch (status) {
    case AuditLogStatus.processing:
    case AuditLogStatus.retrying:
      return ProcessingIcon

    case AuditLogStatus.completed:
      return SuccessIcon

    default:
      return ErrorIcon
  }
}
