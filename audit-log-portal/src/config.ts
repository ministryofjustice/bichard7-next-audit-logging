import getConfig from "next/config"

const { serverRuntimeConfig } = getConfig()

interface PortalConfig {
  apiUrl: string
}

const config: PortalConfig = {
  apiUrl: serverRuntimeConfig.apiUrl
}

export default config
