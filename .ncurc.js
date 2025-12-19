/*
  Pinned:
  - eslint [???]
  - esbuild [15/04/24 - breaks serverless-esbuild]
*/
/*
  Minor:
  - severless [28/04/24 - major bump breaks dependencies]
  - serverless-offline [28/04/24 - major bump breaks dependencies]
*/
const minor = [
  "eslint",
  "@typescript-eslint/parser",
  "@typescript-eslint/eslint-plugin",
  "uuid",
  "eslint-plugin-jest",
  "zod"
]
const patch = ["esbuild"]

const ignored = []
const skipped = []

module.exports = {
  target: (pkg) => {
    if (minor.some((pin) => pin === pkg)) {
      const res = "minor"
      console.log(` ${pkg} is pinned to ${res} upgrades only (.ncurc.js)`)
      return res
    }

    if (patch.some((pin) => pin === pkg)) {
      const res = "patch"
      console.log(` ${pkg} is pinned to ${res} upgrades only (.ncurc.js)`)
      return res
    }

    return "latest"
  },

  filterResults: (pkg, { upgradedVersion }) => {
    if (ignored.some((ignore) => ignore.pkg === pkg)) {
      return false
    }
    if (skipped.some((skip) => skip.pkg === pkg && skip.version === upgradedVersion)) {
      return false
    }
    return true
  }
}
