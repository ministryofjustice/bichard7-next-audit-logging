import styled from "styled-components"
import { Card, CardContent, Typography } from "@material-ui/core"
import type { AuditLog } from "shared"
import AuditLogStatus from "shared/dist/types/AuditLogStatus"
import DateTime from "components/DateTime"
import getDaysOld from "./getDaysOld"
import StatusIcon from "./StatusIcon"
import ViewEventsButton from "./ViewEventsButton"
import RetryButton from "./RetryButton"

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
  display: flex;
  justify-content: flex-end;
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
          <RetryButton message={message} show={message.status === AuditLogStatus.error} isRetrying={false} />
          <ViewEventsButton message={message} />
        </Actions>
      </InnerContainer>
    </Container>
  )
}

export default Message
