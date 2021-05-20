import classNames from "classnames"
import DateTime from "components/DateTime"
import { AuditLog } from "shared"
import styles from "./Message.module.css"

interface Props {
  message: AuditLog
}

const Message = ({ message }: Props) => (
  <div className={classNames(styles.container, "row")}>
    <div className={styles.innerContainer}>
      <div>
        <div className={styles.correlationId}>{message.externalCorrelationId}</div>

        <div className={styles.receivedDate}>
          <DateTime date={message.receivedDate} prefix="Received: " />
        </div>
      </div>

      {/* TODO: X Days Old */}
      {/* TODO: Button: View XML */}
      {/* TODO: Button: View Events */}
    </div>
  </div>
)

export default Message
