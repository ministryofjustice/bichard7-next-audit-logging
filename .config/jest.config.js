/* eslint-disable no-undef */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  modulePathIgnorePatterns: ["node_modules", "build", "dist"],
  moduleNameMapper: {
    "src/(.*)": "<rootDir>/src/$1"
  }
}
