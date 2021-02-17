export type HandlerContext = {
    succeed(result: string): void;
    fail(error: string): void;
}
