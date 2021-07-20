import styled from "styled-components"
import Link from "next/link"
import { Badge, Card, CardContent, CircularProgress, IconButton, Tooltip, Typography } from "@material-ui/core"
import type { AuditLog } from "shared"
import AuditLogStatus from "shared/dist/types/AuditLogStatus"
import DateTime from "components/DateTime"
import EventIcon from "icons/EventIcon"
import If from "components/If"
import getDaysOld from "./getDaysOld"
import StatusIcon from "./StatusIcon"
import RetryDialogButton from "./RetryDialogConfirm"

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
  width: 100px;
`

const RetryAction = styled(Block)`
  float: left;
`

const ViewEventAction = styled(Block)`
  float: right;
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
          <RetryAction>
            <If condition={retryActionVisible}>
              <If condition={!retrying}>
                <RetryDialogButton message={message} />
              </If>
              <If condition={retrying}>
                <Tooltip title="Retrying" aria-label="retry">
                  <CircularProgress color="secondary" />
                </Tooltip>
              </If>
            </If>
          </RetryAction>

          <ViewEventAction>
            <Badge badgeContent={(message.events || []).length} color="secondary">
              <Link href={`/messages/${message.messageId}`}>
                <Tooltip title="View events" aria-label="view">
                  <IconButton color="default">
                    <EventIcon />
                  </IconButton>
                </Tooltip>
              </Link>
            </Badge>
          </ViewEventAction>
        </Actions>
      </InnerContainer>
    </Container>
  )
}

export default Message
