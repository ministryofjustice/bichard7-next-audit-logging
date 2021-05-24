import { ReactElement } from "react"
import { render, RenderOptions } from "@testing-library/react"
import { ThemeProvider } from "styled-components"
import theme from "styles/theme"

interface Props {
  children: ReactElement
}

const WrapperComponent = ({ children }: Props) => <ThemeProvider theme={theme}>{children}</ThemeProvider>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const customRender = (ui: ReactElement, options?: RenderOptions<any, Element>) =>
  render(ui, { wrapper: WrapperComponent, ...options })

export * from "@testing-library/react"

export { customRender as render }
