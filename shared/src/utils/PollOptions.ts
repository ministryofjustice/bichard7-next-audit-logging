import PollCondition from "./PollCondition"

type PollOptions<T> = {
  timeout?: number
  delay?: number
  condition?: PollCondition<T>
}

export default PollOptions
