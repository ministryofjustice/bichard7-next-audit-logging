import { memo, useState } from "react"
import { IconButton, TextField } from '@material-ui/core';
import styled from "styled-components"
import SearchIcon from "icons/SearchIcon"
import type MessageSearchModel from "types/MessageSearchModel"
import StatusField from "./StatusField"

const Container = styled.form`
  display: flex;
  flex-direction: row;
  gap: 0 0.5rem;
`

const SearchIdField = styled(TextField)`
  flex-grow: 1;
`

interface Props {
  onSearch: (model: MessageSearchModel) => void
  disabled?: boolean
}

const MessageSearch = ({ onSearch, disabled = false }: Props) => {
  const [searchId, setSearchId] = useState("")
  const [status, setStatus] = useState("")

  const triggerSearch = () => onSearch({ searchId, status })
  const onStatusChange = (value: string) => {
    setStatus(value)
    setSearchId("")
  }
  const onSearchIdChange = (value: string) => {
    setStatus("")
    setSearchId(value)
  }

  return (
    <Container
      onSubmit={(e) => {
        e.preventDefault()
        triggerSearch()
      }}
    >
      <StatusField value={status} onChange={onStatusChange} />

      <SearchIdField
        variant="outlined"
        label="Search by ID (External Correlation ID or Internal Message ID)"
        value={searchId}
        onChange={(e) => onSearchIdChange(e.target.value || "")}
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
