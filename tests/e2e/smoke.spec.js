// =============================================================================
// E2E Environment Smoke Test
// Verifies test harness and local server connectivity
// =============================================================================

const { test, expect } = require('@playwright/test');

test.describe('E2E Environment Harness', () => {
  test('ポータル画面が正常にロードされ、タイトルが表示されること', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Games Portal/i);
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });
});
