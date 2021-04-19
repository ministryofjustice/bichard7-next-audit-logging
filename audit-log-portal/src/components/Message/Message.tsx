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

const Message = ({ message }: Props): JSX.Element => (
  <div className={classNames(styles.container, "row")}>
    <h1>123</h1>
    <h1>321</h1>
    <div className={styles["inner-container"]}>
      <div className={styles["information-block"]}>
        <p className={styles.label}>{`Message Id`}</p>
        <p>{message.messageId}</p>
      </div>

      <div className={styles["information-block"]}>
        <p className={styles.label}>{`Case Number`}</p>
        <p>{message.caseId}</p>
      </div>

      <div className={styles["information-block"]}>
        <p className={styles.label}>{`Received Date`}</p>
        <p>
          <DateTime date={message.receivedDate} />
        </p>
      </div>
    </div>
  </div>
)

export default Message
