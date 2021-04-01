module.exports = {
  preset: "ts-jest",
  clearMocks: true,
  testEnvironment: "node",
  transform: {
    "\\.[jt]sx?$": "babel-jest"
  },
  moduleDirectories: ["node_modules", "."],
  moduleNameMapper: {
    "^.+\\.(css)$": "identity-obj-proxy"
  },
  setupFilesAfterEnv: ["./scripts/setupTests.js"]
}
