module.exports = {
  preset: "ts-jest",
  clearMocks: true,
  testEnvironment: "jsdom",
  transform: {
    "\\.[jt]sx?$": "babel-jest"
  },
  moduleDirectories: ["node_modules", "./src"],
  moduleNameMapper: {
    "^.+\\.(css)$": "identity-obj-proxy"
  },
  setupFilesAfterEnv: ["./scripts/setupTests.js"]
}
