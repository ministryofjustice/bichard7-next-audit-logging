const fs = require("fs")

const srcFolder = "./pnc-status-debugging"
const dstFolder = "./pnc-failures"
console.log("Filtering files")

fs.mkdirSync(dstFolder, { recursive: true })

const allFiles = fs.readdirSync(srcFolder)

const shouldMove = (message) =>
  message.events.some(
    (event) => event.eventCode === "pnc.response-received" && event.attributes["PNC Request Type"] !== "ENQASI"
  )

allFiles.forEach((file) => {
  const content = fs.readFileSync(`${srcFolder}/${file}`)
  const parsed = JSON.parse(content)
  if (shouldMove(parsed)) {
    fs.writeFileSync(`${dstFolder}/${file.replace(".json", "")}.json`, content)
  }
})
