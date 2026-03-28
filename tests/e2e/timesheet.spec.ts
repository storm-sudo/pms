import { test, expect } from '@playwright/test';

test.describe('Clinical Timesheet Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('#email', 'shahebaazkazi002nt@gmail.com');
    await page.fill('#password', 'dmin123');
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL('/');
  });

  test('should start and stop timer on a task correctly', async ({ page }) => {
    // Navigate to Projects
    await page.click('nav >> text=Projects');
    
    // Open the first task's detail panel
    const taskRow = page.locator('div.flex-1.text-sm.truncate').first();
    const taskName = await taskRow.innerText();
    await taskRow.click();
    
    // Check if Detail Panel is open
    await expect(page.locator('h2', { hasText: taskName })).toBeVisible();
    
    // Start Timer
    const startBtn = page.locator('button:has-text("Start Timer")');
    await startBtn.click();
    
    // Verify Live Badge appeared
    await expect(page.locator('text=Live:')).toBeVisible();
    
    // Wait for 2 seconds of "clock time"
    await page.waitForTimeout(2000);
    
    // Stop Timer
    const stopBtn = page.locator('button:has-text("Stop Timer")');
    await stopBtn.click();
    
    // Verify Live Badge is gone
    await expect(page.locator('text=Live:')).not.toBeVisible();
    
    // Verify work log entry exists
    await expect(page.locator('p:has-text("Work Discovery Logs")')).toBeVisible();
    // It might take a moment to appear if there's a backend call
    await expect(page.locator('div.p-3.rounded-lg.bg-muted\\/50').first()).toBeVisible();
  });
});
