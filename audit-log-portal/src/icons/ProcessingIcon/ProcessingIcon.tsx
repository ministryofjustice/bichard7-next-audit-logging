import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCircleNotch } from "@fortawesome/free-solid-svg-icons"
import styled from "styled-components"

const ColoredIcon = styled(FontAwesomeIcon)`
  ${({ theme }) => `
    color: ${theme.palette.info.main};
    width: 36px !important;
    height: 36px !important;
  `}
  animation: rotate-clockwise 1.7s infinite linear;
`

const ProcessingIcon = () => <ColoredIcon icon={faCircleNotch} />

export default ProcessingIcon
