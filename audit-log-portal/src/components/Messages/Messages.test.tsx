import { shallow } from "enzyme"
import Message from "components/Message"
import Messages from "./Messages"

const messages = [
  {
    messageId: "Message1",
    caseId: "123",
    receivedDate: new Date()
  },
  {
    messageId: "Message2",
    caseId: "456",
    receivedDate: new Date()
  }
]

describe("<Messages />", () => {
  it("should not render any <Message /> component when there are no messages", () => {
    const component = shallow(<Messages messages={[]} />)
    expect(component.find(Message)).toHaveLength(0)
    expect(component.contains("No messages")).toBe(true)
  })

  it("should render 2 <Message /> components when there are 2 messages", () => {
    const component = shallow(<Messages messages={messages} />)
    expect(component.find(Message)).toHaveLength(2)
  })
})
