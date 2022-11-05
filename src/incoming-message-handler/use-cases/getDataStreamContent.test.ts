import { v4 as uuidv4 } from "uuid"
import getDataStreamContent from "./getDataStreamContent"

const generateXml = (attributes?: string) => `<?xml version="1.0" encoding="UTF-8"?>
<RouteData xmlns="http://schemas.cjse.gov.uk/common/operations" xmlns:cjseEntity="http://schemas.cjse.gov.uk/common/businessentities" xmlns:cjseType="http://schemas.cjse.gov.uk/common/businesstypes" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" VersionNumber="1.0" RequestResponse="Request">
  <RequestFromSystem VersionNumber="1.0">
    <CorrelationID>${uuidv4()}</CorrelationID>
  </RequestFromSystem>
  <DataStream VersionNumber="1.0">
    <DataStreamContent${attributes ?? ""}>
      <DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow='ResultedCasesForThePolice' Interface='LibraStandardProsecutorPolice' SchemaVersion='0.6g'>
        &lt;DC:Session&gt;
          <DC:Case>
            <DC:PTIURN>
              123456789
            </DC:PTIURN>
          </DC:Case>
        &lt;/DC:Session&gt;
      </DC:ResultedCaseMessage>
    </DataStreamContent>
  </DataStream>
</RouteData>`

const xmlWithNestedDataStreamContent = `<?xml version="1.0" encoding="UTF-8"?>
<RouteData xmlns="http://schemas.cjse.gov.uk/common/operations" xmlns:cjseEntity="http://schemas.cjse.gov.uk/common/businessentities" xmlns:cjseType="http://schemas.cjse.gov.uk/common/businesstypes" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" VersionNumber="1.0" RequestResponse="Request">
  <RequestFromSystem VersionNumber="1.0">
    <CorrelationID>${uuidv4()}</CorrelationID>
  </RequestFromSystem>
  <DataStream VersionNumber="1.0">
    <DataStreamContent attr1="value 1">
      <DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow='ResultedCasesForThePolice' Interface='LibraStandardProsecutorPolice' SchemaVersion='0.6g'>
        &lt;DC:Session&gt;
          <DC:Case>
            <DataStreamContent attr2="value 2">
            </DataStreamContent>
            <DC:PTIURN>
              123456789
            </DC:PTIURN>
          </DC:Case>
        &lt;/DC:Session&gt;
      </DC:ResultedCaseMessage>
    </DataStreamContent>
  </DataStream>
</RouteData>`

describe("getDataStreamContent", () => {
  it("should return the DataStreamContent content when it doesn't have attributes", () => {
    const xml = generateXml()
    const result = getDataStreamContent(xml)

    expect(result)
      .toBe(`<DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow='ResultedCasesForThePolice' Interface='LibraStandardProsecutorPolice' SchemaVersion='0.6g'>
        &lt;DC:Session&gt;
          <DC:Case>
            <DC:PTIURN>
              123456789
            </DC:PTIURN>
          </DC:Case>
        &lt;/DC:Session&gt;
      </DC:ResultedCaseMessage>`)
  })

  it("should return the DataStreamContent content when it has attributes", () => {
    const xml = generateXml(` attr1="value 1"
    attr2=value
    `)
    const result = getDataStreamContent(xml)

    expect(result)
      .toBe(`<DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow='ResultedCasesForThePolice' Interface='LibraStandardProsecutorPolice' SchemaVersion='0.6g'>
        &lt;DC:Session&gt;
          <DC:Case>
            <DC:PTIURN>
              123456789
            </DC:PTIURN>
          </DC:Case>
        &lt;/DC:Session&gt;
      </DC:ResultedCaseMessage>`)
  })

  it("should return the top most DataStreamContent content when there are nested DataStreamContent", () => {
    const result = getDataStreamContent(xmlWithNestedDataStreamContent)

    expect(result)
      .toBe(`<DC:ResultedCaseMessage xmlns:DC="http://www.dca.gov.uk/xmlschemas/libra" Flow='ResultedCasesForThePolice' Interface='LibraStandardProsecutorPolice' SchemaVersion='0.6g'>
        &lt;DC:Session&gt;
          <DC:Case>
            <DataStreamContent attr2="value 2">
            </DataStreamContent>
            <DC:PTIURN>
              123456789
            </DC:PTIURN>
          </DC:Case>
        &lt;/DC:Session&gt;
      </DC:ResultedCaseMessage>`)
  })

  it("should return undefined if DataStreamContent does not exist", () => {
    const result = getDataStreamContent("<xml><element></element</xml>")

    expect(result).toBeUndefined()
  })
})
