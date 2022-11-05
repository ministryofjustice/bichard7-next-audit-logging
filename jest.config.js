/* eslint-disable no-undef */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  modulePathIgnorePatterns: ["node_modules", "build"],
  testPathIgnorePatterns: ["src/audit-log-portal/*"],
  moduleNameMapper: {
    "src/(.*)": "<rootDir>/src/$1"
  }
}
