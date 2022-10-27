import type { AppProps } from "next/app"
import { ThemeProvider as MuiThemeProvider, CssBaseline } from "@material-core/ui"
import { ThemeProvider } from "styled-components"
import theme from "styles/theme"
import "styles/globals.css"

/* eslint-disable react/jsx-props-no-spreading */
const App = ({ Component, pageProps }: AppProps) => (
  <MuiThemeProvider theme={theme}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Component {...pageProps} />
    </ThemeProvider>
  </MuiThemeProvider>
)

export default App
