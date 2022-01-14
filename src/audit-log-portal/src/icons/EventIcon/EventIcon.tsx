import { memo } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCalendarDay } from "@fortawesome/free-solid-svg-icons"

const EventIcon = () => (
  <FontAwesomeIcon
    icon={faCalendarDay}
    style={{
      width: 18,
      height: 18
    }}
  />
)

export default memo(EventIcon)
