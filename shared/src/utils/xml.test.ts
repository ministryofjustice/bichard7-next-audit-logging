import { clean, hasRootElement, parseXml } from "./xml"

describe("xml", () => {
  describe("clean", () => {
    it("should replace all &lt; and &gt; with < and > respectively", () => {
      const xml = "&lt;test&gt;41BP0510007&lt;/test&gt;"
      const cleanXml = clean(xml)

      expect(cleanXml).not.toContain("&lt;")
      expect(cleanXml).not.toContain("&gt;")
      expect(cleanXml).toContain("<")
      expect(cleanXml).toContain(">")
    })
  })

  describe("parseXml", () => {
    it("should parse the xml into an object", async () => {
      type Person = { name: string }
      const personXml = "<name>Bob</name>"
      const xml = await parseXml<Person>(personXml)

      expect(xml.name).toBe("Bob")
    })
  })

  describe("hasRootElement", () => {
    it("should return true if the xml contains the element", async () => {
      const personXml = "<person><name>Bob</name></person>"
      const hasElement = await hasRootElement(personXml, "person")

      expect(hasElement).toBe(true)
    })

    it("should return false if the xml does not contain the element", async () => {
      const personXml = "<person><name>Bob</name></person>"
      const hasElement = await hasRootElement(personXml, "employee")

      expect(hasElement).toBe(false)
    })

    it("should return false if the xml contains the element but is not the root element", async () => {
      const personXml = "<person><name>Bob</name></person>"
      const hasElement = await hasRootElement(personXml, "name")

      expect(hasElement).toBe(false)
    })
  })
})
