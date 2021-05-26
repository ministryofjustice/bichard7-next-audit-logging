import styled from "styled-components"
import Link from "next/link"
import { Badge, Button, Card, CardContent, Typography } from "@material-ui/core"
import { AuditLog } from "shared"
import DateTime from "components/DateTime"
import EventIcon from "icons/EventIcon"
import getDaysOld from "./getDaysOld"

interface Props {
  message: AuditLog
}

const Container = styled(Card)`
  margin-bottom: 1rem;
`

const InnerContainer = styled(CardContent)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  &:last-child: {
    padding-bottom: 0;
  }
`

const Block = styled.div`
  margin-right: 1.5rem;
`

const ReceivedDate = styled(Typography)`
  ${({ theme }) => `
    color: ${theme.palette.text.disabled};
  `}
`

const Actions = styled.div`
  margin-left: 1rem;
`

const Message = ({ message }: Props) => (
  <Container>
    <InnerContainer>
      <Block>
        <Typography variant="h6">{message.externalCorrelationId}</Typography>

        <ReceivedDate variant="caption">
          <DateTime date={message.receivedDate} prefix="Received: " />
        </ReceivedDate>
      </Block>

      <Typography variant="h6">{getDaysOld(message.receivedDate)}</Typography>

      <Actions>
        {/* TODO: Button: View XML */}
        <Badge badgeContent={(message.events || []).length} color="secondary">
          <Link href={`/messages/${message.messageId}`}>
            <Button variant="outlined" color="default" startIcon={<EventIcon />}>
              {`View Events`}
            </Button>
          </Link>
        </Badge>
      </Actions>
    </InnerContainer>
  </Container>
)

export default Message
