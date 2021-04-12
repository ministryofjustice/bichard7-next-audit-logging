import { shallow } from "enzyme"
import Message from "./Message"

const message = {
  messageId: "Message1",
  caseId: "Case1000",
  receivedDate: new Date("2021-05-01T10:25:53")
}

describe("<Message />", () => {
  it("should render <Message /> when message has value", () => {
    const component = shallow(<Message message={message} />)
    expect(component.contains("Message1")).toBe(true)
    expect(component.contains("Case1000")).toBe(true)
    expect(component.html()).toContain("01/05/2021 10:25:53")
  })
})
