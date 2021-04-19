import { dirname } from "path"
import { fileURLToPath } from "url"

const modulePath = dirname(fileURLToPath(import.meta.url))

export default modulePath
