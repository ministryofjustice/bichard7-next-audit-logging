/* eslint-disable import/first */
jest.mock("use-http")

import type { UseFetch } from "use-http"
import useFetch from "use-http"

const mockedUseFetch = useFetch as jest.MockedFunction<typeof useFetch>
mockedUseFetch.mockReturnValue({ response: { ok: false } } as unknown as UseFetch<void>)
