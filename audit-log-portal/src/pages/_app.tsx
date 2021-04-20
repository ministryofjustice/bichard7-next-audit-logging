import { AppProps } from "next/app"
import "styles/globals.css"

/* eslint-disable react/jsx-props-no-spreading */
const App = ({ Component, pageProps }: AppProps) => <Component {...pageProps} />

export default App
