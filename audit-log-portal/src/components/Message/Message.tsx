import styled from "styled-components"
import Link from "next/link"
import { Badge, Button, Card, CardContent, Typography, Tooltip } from "@material-ui/core"
import { AuditLog } from "shared"
import DateTime from "components/DateTime"
import EventIcon from "icons/EventIcon"
import getDaysOld from "./getDaysOld"
import getStatusIcon from "./getStatusIcon"

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
  const StatusIcon = getStatusIcon(message.messageStatus)

  return (
    <Container>
      <InnerContainer>
        <StatusBlock>
          <Tooltip title={message.messageStatus} placement="top">
            <div>
              <StatusIcon />
            </div>
          </Tooltip>
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
