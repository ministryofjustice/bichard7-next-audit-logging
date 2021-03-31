import styles from "./Message.module.css"

interface Props {
  message: {
    messageId: string
    caseId: string
    receivedDate: Date
  }
}

const Message = ({ message }: Props) => (
  <div className={styles.container}>
    <div className={styles.innerContainer}>
      <div className={styles.informationBlock}>
        <label className={styles.label}>
          Message Id
        </label>
        <p>
          {message.messageId}
        </p>
      </div>

      <div className={styles.informationBlock}>
        <label className={styles.label}>
          Case Number
        </label>
        <p>
          {message.caseId}
        </p>
      </div>

      <div className={styles.informationBlock}>
        <label className={styles.label}>
          Received Date
        </label>
        <p>
          {message.receivedDate.toString()}
        </p>
      </div>
    </div>
  </div>
)

export default Message
