import ErrorIcon from "icons/ErrorIcon"
import ProcessingIcon from "icons/ProcessingIcon"
import SuccessIcon from "icons/SuccessIcon"
import type { ComponentType } from "react"
import AuditLogStatus from "types/AuditLogStatus"

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
