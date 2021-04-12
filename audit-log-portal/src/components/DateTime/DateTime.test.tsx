import { shallow } from "enzyme"
import DateTime from "./DateTime"

describe("<DateTime />", () => {
  it("should render correct date time format", () => {
    const date = new Date("2021-04-01T13:20:30")
    const expectedDateString = "01/04/2021 13:20:30"
    const component = shallow(<DateTime date={date} />)
    expect(component.html()).toContain(expectedDateString)
  })

  it("should not render when date has no value", () => {
    const component = shallow(<DateTime date={null} />)
    expect(component.html()).toBe("")
  })
})
