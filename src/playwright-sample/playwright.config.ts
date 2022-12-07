import { devices, PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  forbidOnly: true,
  retries: 1,
  testDir: 'src',
  timeout: 3 * 60 * 1000,
  use: {
    trace: 'on-first-retry',
    video: 'on',
    acceptDownloads: true,
    screenshot: 'on',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'safari',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  expect: {
    toMatchSnapshot: { threshold: 0.5 },
  },
}
export default config
