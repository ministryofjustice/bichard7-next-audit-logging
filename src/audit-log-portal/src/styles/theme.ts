import { createTheme } from "@material-ui/core/styles"

const theme = createTheme({
  palette: {
    primary: {
      main: "#2196F3",
      dark: "#1976D2",
      light: "#BBDEFB"
    },
    secondary: {
      main: "#009688"
    }
  },
  typography: {
    button: {
      textTransform: "none"
    }
  }
})

export default theme
