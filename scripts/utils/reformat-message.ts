import fs from "fs"
import transformMessageXml from "../../src/incoming-message-handler/use-cases/transformMessageXml"
import type AuditLog from "../../src/shared/types/AuditLog"

const fileName = process.argv[process.argv.length - 1]
const rawFile = fs.readFileSync(fileName).toString()
const messageId = rawFile.match(/<CorrelationID>([^<]*)<\/CorrelationID>/)![1]
const transformed = transformMessageXml({ messageId } as AuditLog, rawFile)
fs.writeFileSync(fileName.replace(".xml", ".transformed.xml"), transformed)
