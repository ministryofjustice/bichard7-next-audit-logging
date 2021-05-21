import { AppProps } from "next/app"
import { ThemeProvider } from "styled-components"
import theme from "styles/theme"
import "styles/globals.css"

/* eslint-disable react/jsx-props-no-spreading */
const App = ({ Component, pageProps }: AppProps) => (
  <ThemeProvider theme={theme}>
    <Component {...pageProps} />
  </ThemeProvider>
)

export default App
