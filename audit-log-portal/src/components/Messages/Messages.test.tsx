import { shallow } from "enzyme"
import Message from "components/Message"
import Messages from "./Messages"

describe("<Messages />", () => {
  it("should render 10 <Message /> components", () => {
    const component = shallow(<Messages />)
    expect(component.find(Message)).toHaveLength(10)
  })
})
