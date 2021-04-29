import PollAction from "./PollAction"

export type PollCondition<T> = (result: T) => boolean
export type PollOptions<T> = {
  timeout?: number
  delay?: number
  condition?: PollCondition<T>
}

const clearTimeouts = (handles: NodeJS.Timeout[]): void => handles.forEach(clearTimeout)

export default class Poller<T> {
  constructor(private readonly action: PollAction<T>) {}

  poll({ timeout = 10000, delay = 100, condition = (result) => !!result }: PollOptions<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const processHandles: NodeJS.Timeout[] = []

      const timeoutHandle = setTimeout(() => {
        clearTimeouts([timeoutHandle, ...processHandles])
        reject(new Error("Failed polling due to exceeding the timeout"))
      }, timeout)

      const process = async () => {
        const result = await this.action()
        if (condition(result)) {
          clearTimeouts([timeoutHandle, ...processHandles])
          resolve(result)
        } else {
          processHandles.push(setTimeout(process, delay))
        }
      }

      process()
    })
  }
}
