import { recordErrorArchival } from "./recordErrorArchival"
import config from "./config"
import DatabaseClient from "./DatabaseClient"
import { AuditLogApiClient } from "shared"

const db = new DatabaseClient(
  config.dbHost,
  config.dbUser,
  config.dbPassword,
  config.dbName,
  config.dbSchema,
  config.archiveGroupLimit
)
const auditLogApi = new AuditLogApiClient(config.apiUrl, config.apiKey)

recordErrorArchival(db, auditLogApi)
  .catch((err) => {
    console.error(`Failed to record archival of errors: ${err}`)
  })
  .then((statuses) => {
    console.log("Done!")

    console.log(`Successfully updated ${statuses?.filter((record) => record.success).length ?? "0"} records`)

    const failedRecords = statuses?.filter((record) => !record.success)

    if (failedRecords !== undefined && failedRecords.length > 0) {
      console.log("Failed records:")
      failedRecords.forEach((record) => {
        console.log(record)
      })
    }
  })
