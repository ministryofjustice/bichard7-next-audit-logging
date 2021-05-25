import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons"
import styled from "styled-components"

const ColoredIcon = styled(FontAwesomeIcon)`
  ${({ theme }) => `
    color: ${theme.palette.info.main};
    font-size: xx-large;
  `}
`

const InformationIcon = () => <ColoredIcon icon={faInfoCircle} />

export default InformationIcon
