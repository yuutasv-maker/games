// =============================================================================
// Playwright E2E Test Configuration
// =============================================================================

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }]
  ],
  use: {
    baseURL: 'http://127.0.0.1:8085',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] }
    }
  ],
  webServer: {
    command: 'node scripts/serve.js',
    url: 'http://127.0.0.1:8085',
    reuseExistingServer: !process.env.CI,
    timeout: 15000,
    env: {
      NO_PROXY: '127.0.0.1,localhost',
      http_proxy: '',
      https_proxy: ''
    }
  }
});
