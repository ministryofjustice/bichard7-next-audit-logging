import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons"
import styled from "styled-components"

const ColoredIcon = styled(FontAwesomeIcon)`
  ${({ theme }) => `
    color: ${theme.palette.info.main};
    width: 36px !important;
    height: 36px !important;
  `}
`

const InformationIcon = () => <ColoredIcon icon={faInfoCircle} />

export default InformationIcon
