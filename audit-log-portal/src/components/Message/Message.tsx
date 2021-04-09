import React from "react"
import styles from "./Message.module.css"
import DateTime from "components/DateTime"
import classNames from 'classnames'

interface Props {
  message: {
    messageId: string
    caseId: string
    receivedDate: Date
  }
}

const Message = ({ message }: Props) => (
  <div className={classNames(styles.container, "row")}>
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
          <DateTime date={message.receivedDate} />
        </p>
      </div>
    </div>
  </div>
)

export default Message
