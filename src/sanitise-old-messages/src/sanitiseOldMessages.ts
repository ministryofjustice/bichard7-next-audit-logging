import type { ApiClient } from "shared-types"
import { logger } from "shared"
import type { Client } from "pg"

export default async (api: ApiClient, db: Client): Promise<void> => {
  logger.debug("Fetching messages to sanitise")
  await Promise.resolve()
  return Promise.resolve()
}
