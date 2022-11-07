import ErrorIcon from "icons/ErrorIcon"
import InformationIcon from "icons/InformationIcon"
import WarningIcon from "icons/WarningIcon"
import type { ComponentType } from "react"
import type EventCategory from "types/EventCategory"

export default function getCategoryIcon(category: EventCategory): ComponentType {
  switch (category) {
    case "information":
      return InformationIcon

    case "warning":
      return WarningIcon

    case "error":
      return ErrorIcon

    default:
      return undefined
  }
}
