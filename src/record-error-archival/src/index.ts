import { recordErrorArchival } from "./recordErrorArchival"

recordErrorArchival()
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
