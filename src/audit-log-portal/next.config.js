module.exports = {
  basePath: "/audit-logging",
  distDir: "build",
  future: {
    webpack5: true
  },
  serverRuntimeConfig: {
    apiUrl: process.env.API_URL,
    apiKey: process.env.API_KEY
  }
}
