import { Card, CardContent, Typography } from "@material-ui/core"
import styled from "styled-components"
import { AuditLogEvent } from "shared"
import DateTime from "components/DateTime"

interface Props {
  event: AuditLogEvent
}

const Container = styled(Card)`
  margin-bottom: 1rem;
`

const InnerContainer = styled(CardContent)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  &:last-child: {
    padding-bottom: 0;
  }
`

const Icon = styled.div``

const EventSource = styled(Typography)`
  font-weight: bold;
`

const ReceivedDate = styled(Typography)`
  ${({ theme }) => `
    color: ${theme.palette.text.disabled};
    font-style: italic;
  `}
`

const Event = ({ event }: Props) => (
  <Container>
    <InnerContainer>
      <Icon />

      <EventSource variant="body1">{event.eventSource}</EventSource>

      <Typography variant="body1">{event.eventType}</Typography>

      <ReceivedDate variant="caption">
        <DateTime date={event.timestamp} prefix="Received: " />
      </ReceivedDate>
    </InnerContainer>
  </Container>
)

export default Event
