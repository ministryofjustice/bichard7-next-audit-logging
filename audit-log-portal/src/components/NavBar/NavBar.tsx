import { memo, ReactNode } from "react"
import styles from "./NavBar.module.css"

interface Props {
  logo: JSX.Element
  title: string
  children?: ReactNode
}

const NavBar = ({ logo, title, children }: Props): JSX.Element => (
  <nav className={styles.navBar}>
    {logo}

    <h1>{title}</h1>

    {children}
  </nav>
)

NavBar.defaultProps = {
  children: null
}

export default memo(NavBar)
