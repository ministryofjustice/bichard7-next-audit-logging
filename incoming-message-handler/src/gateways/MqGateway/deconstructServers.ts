import { connect } from "stompit"
import { MqConfig } from "src/configs"
import parseConnectionOptions from "./parseConnectionOptions"

export default (config: MqConfig): connect.ConnectOptions[] => {
  const connectHeaders: connect.ConnectHeaders = {
    login: config.username,
    passcode: config.password,
    "heart-beat": "5000,5000"
  }

  let { url } = config
  if (/^failover:\(.*\)$/.test(url)) {
    // Remove the failover:() wrapper
    url = url.substring("failover:(".length)
    url = url.substring(0, url.length - 1)
  }

  const servers = url.split(",")
  return servers.map((serverUrl) => {
    const options = parseConnectionOptions(serverUrl)

    return {
      host: options.host,
      port: options.port,
      connectHeaders,

      // The type definitions seem to be locking this as `true`, regardless of
      // what we want to pass in. We should be passing in `options.ssl`, but have
      // to stick to `true` for now (it is working as-is)
      ssl: true,
      timeout: 10000
    }
  })
}
