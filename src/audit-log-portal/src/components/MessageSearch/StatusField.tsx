import { InputLabel, MenuItem, FormControl, Select } from '@material-ui/core';
import styled from "styled-components"

const StatusFormControl = styled(FormControl)`
  flex: 1 0 auto;
  min-width: 7rem;
`

interface Props {
  onChange: (newValue: string) => void
  value: string
}

const StatusField = ({ onChange, value }: Props) => {
  const triggerOnChange = (newStatus) => onChange(newStatus === "all" ? "" : newStatus)

  return (
    <StatusFormControl variant="outlined">
      <InputLabel id="status-select-label">Status</InputLabel>
      <Select
        labelId="status-select-label"
        label="Status"
        id="status-select"
        value={value || "all"}
        onChange={(e) => triggerOnChange(e.target.value as string)}
      >
        <MenuItem value="all">
          <em>All</em>
        </MenuItem>
        <MenuItem value="Processing">Processing</MenuItem>
        <MenuItem value="Retrying">Retrying</MenuItem>
        <MenuItem value="Completed">Completed</MenuItem>
        <MenuItem value="Error">Error</MenuItem>
      </Select>
    </StatusFormControl>
  )
}

export default StatusField
