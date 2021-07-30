import { memo } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faRedo } from "@fortawesome/free-solid-svg-icons"
import styled from "styled-components"

interface Props {
  spin?: boolean
}

const RetryFontAwesomeIcon = styled(FontAwesomeIcon)`
  animation: ${(props) => (props.spin ? "rotate-clockwise linear 0.5s infinite" : "none")};
`

const RetryIcon = ({ spin }: Props) => (
  <RetryFontAwesomeIcon
    icon={faRedo}
    style={{
      width: 18,
      height: 18
    }}
    spin={spin}
  />
)

export default memo(RetryIcon)
