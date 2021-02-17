export type Result<T> = T | Error;
export function isError<T>(result: Result<T>) {
  return result instanceof Error;
}
export function isSuccess<T>(result: Result<T>) {
  return !isError(result);
}
