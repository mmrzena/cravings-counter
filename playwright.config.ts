import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:3100',
    channel: 'chrome',
    timezoneId: 'Europe/Prague',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: {
    command: 'npm run start -- --port 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
  },
})
