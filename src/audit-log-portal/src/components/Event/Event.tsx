import { CardContent, Typography, Card } from '@material-core/ui';
import styled from "styled-components"
import type { AuditLogEvent } from "shared-types"
import DateTime from "components/DateTime"
import getCategoryIcon from "./getCategoryIcon"

interface Props {
  event: AuditLogEvent
}

const Container = styled(Card)`
  margin-bottom: 1rem;
`

const InnerContainer = styled(CardContent)`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;

  &:last-child: {
    padding-bottom: 0;
  }
`

const IconContainer = styled.div`
  margin-right: 1rem;
`

const EventSource = styled(Typography)`
  margin-right: 2rem;
  font-weight: bold;
`
const EventType = styled(Typography)`
  flex-grow: 1;
`

const ReceivedDate = styled(Typography)`
  ${({ theme }) => `
    color: ${theme.palette.text.disabled};
    font-style: italic;
  `}
`

const Event = ({ event }: Props) => {
  const Icon = getCategoryIcon(event.category)

  return (
    <Container>
      <InnerContainer>
        <IconContainer>
          <Icon />
        </IconContainer>

        <EventSource variant="body1">{event.eventSource}</EventSource>

        <EventType variant="body1">{event.eventType}</EventType>

        <ReceivedDate variant="caption">
          <DateTime date={event.timestamp} prefix="Received: " />
        </ReceivedDate>
      </InnerContainer>
    </Container>
  )
}

export default Event
