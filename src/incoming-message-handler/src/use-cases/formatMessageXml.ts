import { v4 as uuidv4 } from "uuid"

const formatMessageXml = (message: string): string => {
  const wrappedMessage = `<?xml version="1.0" encoding="UTF-8"?>
  <RouteData xmlns="http://schemas.cjse.gov.uk/common/operations" xmlns:cjseEntity="http://schemas.cjse.gov.uk/common/businessentities" xmlns:cjseType="http://schemas.cjse.gov.uk/common/businesstypes" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" VersionNumber="1.0" RequestResponse="Request">
    <RequestFromSystem VersionNumber="1.0">
      <CorrelationID>${uuidv4()}</CorrelationID>
    </RequestFromSystem>
    <DataStream VersionNumber="1.0">
      <DataStreamContent>${message}</DataStreamContent>
    </DataStream>
  </RouteData>`

  return wrappedMessage
}

export default formatMessageXml
