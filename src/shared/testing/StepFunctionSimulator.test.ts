import { StepFunctionSimulator } from "."

describe("StepFunctionSimulator", () => {
  it("should execute the functions and pass the outputs into the inputs", async () => {
    const fn1 = jest.fn((input) => `${input}.1`)
    const fn2 = jest.fn((input) => `${input}.2`)
    const fn3 = jest.fn((input) => `${input}.3`)
    const sim = new StepFunctionSimulator([fn1, fn2, fn3])
    const result = await sim.execute("input")
    expect(fn1).toHaveBeenCalled()
    expect(fn2).toHaveBeenCalled()
    expect(fn3).toHaveBeenCalled()
    expect(result).toBe("input.1.2.3")
  })

  it("should execute the async functions and pass the outputs into the inputs", async () => {
    const fn1 = jest.fn((input) => Promise.resolve(`${input}.1`))
    const fn2 = jest.fn((input) => Promise.resolve(`${input}.2`))
    const fn3 = jest.fn((input) => Promise.resolve(`${input}.3`))
    const sim = new StepFunctionSimulator([fn1, fn2, fn3])
    const result = await sim.execute("input")
    expect(fn1).toHaveBeenCalled()
    expect(fn2).toHaveBeenCalled()
    expect(fn3).toHaveBeenCalled()
    expect(result).toBe("input.1.2.3")
  })

  it("should execute the functions and pass the outputs into the inputs with a single function", async () => {
    const fn1 = jest.fn((input) => `${input}.1`)
    const sim = new StepFunctionSimulator([fn1])
    const result = await sim.execute("input")
    expect(fn1).toHaveBeenCalled()
    expect(result).toBe("input.1")
  })
})
