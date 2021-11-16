import getXmlElementContent from "./getXmlElementContent"

it("should return element content when XML element does not have namespace", () => {
  const xml = `
    <ElementA>
      <ElementC>
        <ns2:Data>
          Content C
        </ns2:Data>
      </ElementC>
    </ElementA>
  `

  const expectedResult = `<ns2:Data>
          Content C
        </ns2:Data>`

  const result = getXmlElementContent(xml, "ElementC")

  expect(result).toBe(expectedResult)
})

it("should return element content when XML element has namespace", () => {
  const xml = `
    <ElementF>
      <ns1:ElementB>
        <Data>
          Content
        </Data>
      </ns1:ElementB>
    </ElementF>
  `

  const expectedResult = `<Data>
          Content
        </Data>`

  const result = getXmlElementContent(xml, "ElementB")

  expect(result).toBe(expectedResult)
})

it("should return undefined when XML element does not exist", () => {
  const xml = `
    <ElementE>
      <ns3:ElementD>
        <ElementData>
          Content
        </ElementData>
      </ns3:ElementD>
    </ElementE>
  `

  const result = getXmlElementContent(xml, "UnknownElement")

  expect(result).toBeUndefined()
})
