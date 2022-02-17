import { memo, useState } from "react"
import { IconButton, TextField } from "@material-ui/core"
import styled from "styled-components"
import SearchIcon from "icons/SearchIcon"
import type MessageSearchModel from "types/MessageSearchModel"
import StatusField from "./StatusField"

const Container = styled.form`
  display: flex;
  flex-direction: row;
  gap: 0 0.5rem;
`

const ExternalCorrelationIdField = styled(TextField)`
  flex-grow: 1;
`

const InternalMessageIdField = styled(TextField)`
  flex-grow: 1;
`

interface Props {
  onSearch: (model: MessageSearchModel) => void
  disabled?: boolean
}

const MessageSearch = ({ onSearch, disabled = false }: Props) => {
  const [externalCorrelationId, setExternalCorrelationId] = useState("")
  const [internalMessageId, setInternalMessageId] = useState("")
  const [status, setStatus] = useState("")

  const triggerSearch = () => onSearch({ externalCorrelationId, internalMessageId, status })
  const onStatusChange = (value: string) => {
    setStatus(value)
    setExternalCorrelationId("")
    setInternalMessageId("")
  }
  const onExternalCorrelationIdChange = (value: string) => {
    setStatus("")
    setInternalMessageId("")
    setExternalCorrelationId(value)
  }
  const onInternalMessageIdChange = (value: string) => {
    setStatus("")
    setExternalCorrelationId("")
    setInternalMessageId(value)
  }

  return (
    <Container
      onSubmit={(e) => {
        e.preventDefault()
        triggerSearch()
      }}
    >
      <StatusField value={status} onChange={onStatusChange} />

      <ExternalCorrelationIdField
        variant="outlined"
        label="Search by External Correlation ID"
        value={externalCorrelationId}
        onChange={(e) => onExternalCorrelationIdChange(e.target.value || "")}
        disabled={disabled}
      />

      <InternalMessageIdField
        variant="outlined"
        label="Search by Internal Message ID"
        value={internalMessageId}
        onChange={(e) => onInternalMessageIdChange(e.target.value || "")}
        disabled={disabled}
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
