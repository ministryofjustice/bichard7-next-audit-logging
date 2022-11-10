const fs = require("fs")

const srcFolder = "./pnc-status-debugging"
const dstFolder = "./ignored-messages"
console.log("Filtering files")

fs.mkdirSync(dstFolder, { recursive: true })

const allFiles = fs.readdirSync(srcFolder)

const shouldMove = (message) =>
  message.events.some(
    (event) =>
      (event.eventCode === "hearing-outcome.received" && event.eventSource === "Bichard phase 2") ||
      (event.eventType === "Hearing Outcome published" && event.eventSource === "CourtResultBean") ||
      (event.eventType === "Hearing Outcome message received" &&
        event.eventSource === "PNC ASN-Based Update Choreography")
  ) &&
  !message.events.some(
    (event) => event.eventCode === "pnc.response-received" && event.attributes["PNC Request Type"] !== "ENQASI"
  )

allFiles.forEach((file) => {
  const content = fs.readFileSync(`${srcFolder}/${file}`)
  const parsed = JSON.parse(content)
  if (shouldMove(parsed)) {
    fs.writeFileSync(`${dstFolder}/${file.replace(".json", "")}.json`, content)
  }
})
