import styled from "styled-components"
import Link from "next/link"
import { Badge, Button, Card, CardContent, Typography } from "@material-ui/core"
import type { AuditLog } from "shared"
import DateTime from "components/DateTime"
import EventIcon from "icons/EventIcon"
import RetryIcon from "icons/RetryIcon"
import If from "components/If"
import getDaysOld from "./getDaysOld"
import StatusIcon from "./StatusIcon"

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
  gap: 0 1rem;

  &:last-child: {
    padding-bottom: 0;
  }
`

const Block = styled.div`
  flex: 0;
`

const StatusBlock = styled(Block)`
  text-align: center;
  flex-basis: 3rem;
`

const ReceivedDate = styled(Typography)`
  ${({ theme }) => `
    color: ${theme.palette.text.disabled};
  `}
`

const DaysAgo = styled(Typography)`
  flex: 1;
  text-align: center;
`

const Actions = styled.div`
  flex: 0;
  white-space: nowrap;
`

const Message = ({ message }: Props) => {
  return (
    <Container>
      <InnerContainer>
        <StatusBlock>
          <StatusIcon message={message} />
        </StatusBlock>
        <Block>
          <Typography noWrap variant="h6">
            {message.externalCorrelationId}
          </Typography>

          <ReceivedDate noWrap variant="caption">
            <DateTime date={message.receivedDate} prefix="Received: " />
          </ReceivedDate>
        </Block>

        <DaysAgo variant="h6">{getDaysOld(message.receivedDate)}</DaysAgo>

        <Actions>
          {/* TODO: Button: View XML */}

          <If condition={message.status === "Error"}>
            {/* TODO: Add link to relevant backend logic to trigger retry functionality */}
            <Button variant="outlined" color="default" startIcon={<RetryIcon />}>
              {`Retry Message`}
            </Button>
          </If>

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
}

export default Message
