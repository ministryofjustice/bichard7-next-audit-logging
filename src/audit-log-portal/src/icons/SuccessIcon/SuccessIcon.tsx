import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons"
import styled from "styled-components"

const ColoredIcon = styled(FontAwesomeIcon)`
  ${({ theme }) => `
    color: ${theme.palette.success.main};
    width: 36px !important;
    height: 36px !important;
  `}
`

const PassIcon = () => <ColoredIcon icon={faCheckCircle} />

export default PassIcon
