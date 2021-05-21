import { memo } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCalendarDay } from "@fortawesome/free-solid-svg-icons"

const EventIcon = () => <FontAwesomeIcon icon={faCalendarDay} />

export default memo(EventIcon)
