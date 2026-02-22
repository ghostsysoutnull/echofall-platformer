const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:8081",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "android-chrome",
      use: {
        ...devices["Pixel 7"]
      }
    },
    {
      name: "ios-safari",
      use: {
        ...devices["iPhone 13"]
      }
    }
  ],
  webServer: {
    command: "npx --yes http-server -p 8081 -c-1",
    url: "http://127.0.0.1:8081/game.html",
    reuseExistingServer: true,
    timeout: 120000
  }
});
