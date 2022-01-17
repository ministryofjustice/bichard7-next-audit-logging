import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons"
import styled from "styled-components"

const ColoredIcon = styled(FontAwesomeIcon)`
  ${({ theme }) => `
    color: ${theme.palette.warning.main};
    width: 36px;
    height: 36px;
  `}
`

const WarningIcon = () => <ColoredIcon icon={faExclamationTriangle} />

export default WarningIcon