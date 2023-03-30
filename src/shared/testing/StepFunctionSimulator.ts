/* eslint-disable @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any */

const flatten = (input: any): any => JSON.parse(JSON.stringify(input))

export default class StepFunctionSimulator {
  private steps: Function[]

  private outputs: unknown[]

  constructor(steps: Function[]) {
    this.steps = steps
  }

  async execute(input: any, log = false): Promise<any> {
    this.outputs = []
    let inputValue = input

    for (const step of this.steps) {
      if (log) {
        console.log(step, inputValue)
      }
      inputValue = await step(flatten(inputValue))
      if (typeof inputValue === "object" && "__next_step" in inputValue && inputValue.__next_step === null) {
        break
      }

      this.outputs.push(inputValue)
    }
    return inputValue
  }

  getOutput(functionIndex: number) {
    return this.outputs[functionIndex]
  }
}
