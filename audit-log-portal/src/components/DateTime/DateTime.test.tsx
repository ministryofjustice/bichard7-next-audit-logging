import { shallow } from "enzyme"
import DateTime from "./DateTime"

describe("<DateTime />", () => {
  it("should render correct date time format when date is type of Date", () => {
    const date = new Date("2021-04-01T13:20:30")
    const expectedDateString = "01/04/2021 13:20:30"
    const component = shallow(<DateTime date={date} />)
    expect(component.find("time").text()).toContain(expectedDateString)
  })

  it("should render correct date time format when date is type of String", () => {
    const dateString = "2021-04-01T13:20:30"
    const expectedDateString = "01/04/2021 13:20:30"
    const component = shallow(<DateTime date={dateString} />)
    expect(component.find("time").text()).toContain(expectedDateString)
  })

  it("should not render when date has no value", () => {
    const component = shallow(<DateTime date={null} />)
    expect(component.html()).toBe("")
  })
})
