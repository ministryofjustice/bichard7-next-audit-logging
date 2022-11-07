/* no-underscore-dangle rule disabled as properties are used in this class */
/* eslint-disable no-underscore-dangle */
import type PollCondition from "./PollCondition"

export default class PollOptions<T> {
  private _delay = 0

  private _condition: PollCondition<T>

  constructor(public readonly timeout: number) {
    this.condition = (result) => !!result
  }

  public set delay(delay: number) {
    if (delay < 0) {
      throw new Error("Delay must be a positive integer")
    }
    this._delay = delay
  }

  public get delay(): number {
    return this._delay
  }

  public set condition(condition: PollCondition<T>) {
    if (!condition) {
      throw new Error("Condition must have a value")
    }
    this._condition = condition
  }

  public get condition(): PollCondition<T> {
    return this._condition
  }
}
