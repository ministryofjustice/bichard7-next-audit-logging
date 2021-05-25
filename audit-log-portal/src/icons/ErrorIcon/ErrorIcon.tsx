import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons"
import styled from "styled-components"

const ColoredIcon = styled(FontAwesomeIcon)`
  ${({ theme }) => `
    color: ${theme.palette.error.main};
    font-size: xx-large;
  `}
`

const ErrorIcon = () => <ColoredIcon icon={faExclamationCircle} />

export default ErrorIcon
