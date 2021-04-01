import React from "react"
import { shallow } from "enzyme"
import Message from "components/Message"
import Messages from "./Messages"

interface SomeInterface {
  expectedMessageLength: number
}

const expectedMessages: SomeInterface = {
  expectedMessageLength: 10
}

describe("<Messages />", () => {
  it("should render 3 <Message /> components", () => {
    const component = shallow(<Messages />)
    expect(component.find(Message)).toHaveLength(expectedMessages.expectedMessageLength)
  })
})
