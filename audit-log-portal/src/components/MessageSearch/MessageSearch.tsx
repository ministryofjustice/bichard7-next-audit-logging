import { memo, useState } from "react"
import { IconButton, TextField } from "@material-ui/core"
import styled from "styled-components"
import SearchIcon from "icons/SearchIcon"
import MessageSearchModel from "types/MessageSearchModel"

const Container = styled.form`
  display: flex;
  flex-direction: row;
`

const ExternalCorrelationIdField = styled(TextField)`
  flex-grow: 1;
`

interface Props {
  onSearch: (model: MessageSearchModel) => void
  disabled?: boolean
}

const MessageSearch = ({ onSearch, disabled = false }: Props) => {
  const [externalCorrelationId, setExternalCorrelationId] = useState("")

  const triggerSearch = () => onSearch({ externalCorrelationId })

  return (
    <Container
      onSubmit={(e) => {
        e.preventDefault()
        triggerSearch()
      }}
    >
      <ExternalCorrelationIdField
        variant="outlined"
        label="Search by External Correlation Id"
        value={externalCorrelationId}
        onChange={(e) => setExternalCorrelationId(e.target.value || "")}
        disabled={disabled}
        fullWidth
        autoFocus
      />

      <IconButton
        aria-label="search for messages"
        type="submit"
        color="primary"
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault()
          triggerSearch()
        }}
      >
        <SearchIcon />
      </IconButton>
    </Container>
  )
}

export default memo(MessageSearch)
