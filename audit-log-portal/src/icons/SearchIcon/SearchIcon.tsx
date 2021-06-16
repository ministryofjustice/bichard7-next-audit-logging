import { memo } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSearch } from "@fortawesome/free-solid-svg-icons"
import styled from "styled-components"

const ColoredIcon = styled(FontAwesomeIcon)`
  ${({ theme }) => `
    color: ${theme.palette.primary.main};
    width: 36px;
    height: 36px;
  `}
`

const SearchIcon = () => <ColoredIcon icon={faSearch} />

export default memo(SearchIcon)
