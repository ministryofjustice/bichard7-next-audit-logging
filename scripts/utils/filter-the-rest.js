const fs = require("fs")

const srcFolder = "./pnc-status-debugging"
const dstFolder = "./the-rest"
console.log("Filtering files")

fs.mkdirSync(dstFolder, { recursive: true })

const allFiles = fs.readdirSync(srcFolder)

const isIgnored = (message) =>
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

const isPncFailure = (message) =>
  message.events.some(
    (event) => event.eventCode === "pnc.response-received" && event.attributes["PNC Request Type"] !== "ENQASI"
  )

allFiles.forEach((file) => {
  const content = fs.readFileSync(`${srcFolder}/${file}`)
  const parsed = JSON.parse(content)
  if (!isIgnored(parsed) && !isPncFailure(parsed)) {
    fs.writeFileSync(`${dstFolder}/${file.replace(".json", "")}.json`, content)
  }
})
