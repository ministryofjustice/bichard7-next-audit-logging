import getConfig from "next/config"

const { serverRuntimeConfig } = getConfig()

interface PortalConfig {
  apiUrl: string
  apiKey: string
}

const config: PortalConfig = {
  apiUrl: serverRuntimeConfig.apiUrl,
  apiKey: serverRuntimeConfig.apiKey
}

export default config
