import { memo } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faRedo } from "@fortawesome/free-solid-svg-icons"

const RetryIcon = () => (
  <FontAwesomeIcon
    icon={faRedo}
    style={{
      width: 18,
      height: 18
    }}
  />
)

export default memo(RetryIcon)
