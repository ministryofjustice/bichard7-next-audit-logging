import { AppProps } from "next/app"
import "styles/globals.css"
if (process.env.NEXT_PUBLIC_API_MOCKED === "true") {
  require("../../mocks")
}

const App = ({ Component, pageProps }: AppProps) => <Component {...pageProps} />

export default App
