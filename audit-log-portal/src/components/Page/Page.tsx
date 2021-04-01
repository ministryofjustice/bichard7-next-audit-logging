import { memo, ReactNode } from "react"
import styles from "./Page.module.css"

interface Props {
  children: ReactNode
}

const Page = ({ children }: Props) => (
  <main className={styles.page}>
    {children}
  </main>
)

export default memo(Page)
