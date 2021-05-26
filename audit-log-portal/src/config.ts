interface PortalConfig {
  apiUrl: string
}

const config: PortalConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL
}

export default config
