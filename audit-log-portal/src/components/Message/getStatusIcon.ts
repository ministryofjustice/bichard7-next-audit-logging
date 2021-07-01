import { ComponentType } from "react"
import ErrorIcon from "icons/ErrorIcon"
import SuccessIcon from "icons/SuccessIcon"
import ProcessingIcon from "icons/ProcessingIcon"
import { AuditLogStatus } from "shared"

export default function getStatusIcon(status: string): ComponentType {
  switch (status) {
    case AuditLogStatus.processing:
      return ProcessingIcon

    case AuditLogStatus.completed:
      return SuccessIcon

    default:
      return ErrorIcon
  }
}
