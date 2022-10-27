import { MuiThemeProvider, CssBaseline } from "@material-core/ui"
import { ThemeProvider } from "styled-components"
import theme from "styles/theme"
import "styles/globals.css"

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    }
  }
}

export const decorators = [
  Story => (
    <MuiThemeProvider theme={theme}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Story />
      </ThemeProvider>
    </MuiThemeProvider>
  )
]
