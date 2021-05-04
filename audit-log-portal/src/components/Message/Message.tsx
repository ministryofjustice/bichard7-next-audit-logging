import DateTime from "components/DateTime"
import classNames from "classnames"
import styles from "./Message.module.css"

interface Props {
  message: {
    messageId: string
    caseId: string
    receivedDate: Date
  }
}

const Message = ({ message }: Props) => (
  <div className={classNames(styles.container, "row")}>
    <div className={styles["inner-container"]}>
      <div className={styles["information-block"]}>
        <p className={styles.label}>{`Message Id`}</p>
        <p aria-label="Message Id">{message.messageId}</p>
      </div>

      <div className={styles["information-block"]}>
        <p className={styles.label}>{`Case Number`}</p>
        <p aria-label="Case Id">{message.caseId}</p>
      </div>

      <div className={styles["information-block"]}>
        <p className={styles.label}>{`Received Date`}</p>
        <p aria-label="Received Date">
          <DateTime date={message.receivedDate} />
        </p>
      </div>
    </div>
  </div>
)

export default Message
