/*
  Pinned:
  - eslint [???]
  - esbuild [15/04/24 - breaks serverless-esbuild]
  - @babel/core
    - v8 has breaking changes in ts-jest
  - TypeScript
    - v7 breaks @typescript-eslint
*/
const minor = [
  "@babel/core",
  "@typescript-eslint/parser",
  "@typescript-eslint/eslint-plugin",
  "uuid",
  "eslint-plugin-jest",
  "typescript"
]

const patch = ["esbuild"]

module.exports = {
  reject: ["eslint", "zod"],

  target: (pkg) => {
    if (minor.includes(pkg)) {
      console.log(` ${pkg} is pinned to minor upgrades only (.ncurc.js)`)
      return "minor"
    }

    if (patch.includes(pkg)) {
      console.log(` ${pkg} is pinned to patch upgrades only (.ncurc.js)`)
      return "patch"
    }

    return "latest"
  }
}
