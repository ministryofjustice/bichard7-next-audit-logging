export default class StepFunctionSimulator {
  private steps: Function[]

  constructor(steps: Function[]) {
    this.steps = steps
  }

  async execute(input: any, log: boolean = false): Promise<any> {
    let inputValue = input;

    for (let step of this.steps) {
      log && console.log(step, inputValue)
      inputValue = await step(inputValue)
    }
    return inputValue;
  }
}
