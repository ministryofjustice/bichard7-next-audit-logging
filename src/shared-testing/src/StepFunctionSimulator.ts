/* eslint-disable @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any */

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
      inputValue = await step(inputValue)
      this.outputs.push(inputValue)
    }
    return inputValue
  }

  getOutput(functionIndex: number) {
    return this.outputs[functionIndex]
  }
}
