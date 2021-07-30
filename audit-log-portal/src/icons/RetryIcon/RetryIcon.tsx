import { memo } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faRedo } from "@fortawesome/free-solid-svg-icons"

interface Props {
  spin?: boolean
}

const RetryIcon = ({ spin }: Props) => (
  <FontAwesomeIcon
    icon={faRedo}
    style={{
      width: 18,
      height: 18
    }}
    className={spin ? "retry-icon__spinning" : ""}
  />
)

export default memo(RetryIcon)
