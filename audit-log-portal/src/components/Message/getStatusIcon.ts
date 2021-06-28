import { ComponentType } from "react"
import ErrorIcon from "icons/ErrorIcon"
import SuccessIcon from "icons/SuccessIcon"
import ProcessingIcon from "icons/ProcessingIcon"

export default function getStatusIcon(status: string): ComponentType {
  switch (status) {
    case "Processing":
      return ProcessingIcon

    case "Completed":
      return SuccessIcon

    default:
      return ErrorIcon
  }
}
