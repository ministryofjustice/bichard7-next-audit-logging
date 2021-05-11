import { parseXml } from "shared"
import GeneralEventLogItem from "./GeneralEventLogItem"

export default (xml: string): Promise<GeneralEventLogItem> => parseXml<GeneralEventLogItem>(xml)
