import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login successfully with valid NT credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill credentials
    await page.fill('#email', 'shahebaazkazi002nt@gmail.com');
    await page.fill('#password', 'dmin123');
    
    // Click Sign In
    await page.click('button:has-text("Sign In")');
    
    // Check redirection to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show error for invalid domain', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('#email', 'hacker@gmail.com');
    await page.fill('#password', 'password123');
    
    // Check if error message is visible (due to client-side validation)
    await expect(page.locator('text=Email must end with "nt@gmail.com"')).toBeVisible();
    
    // Button should be disabled
    const signInBtn = page.locator('button:has-text("Sign In")');
    await expect(signInBtn).toBeDisabled();
  });

  test('should persist session after reload', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'shahebaazkazi002nt@gmail.com');
    await page.fill('#password', 'dmin123');
    await page.click('button:has-text("Sign In")');
    
    await expect(page).toHaveURL('/');
    
    // Reload page
    await page.reload();
    
    // Should still be on dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should handle logout correctly', async ({ page }) => {
    // Navigate home (assume already logged in via state or login first)
    await page.goto('/login');
    await page.fill('#email', 'shahebaazkazi002nt@gmail.com');
    await page.fill('#password', 'dmin123');
    await page.click('button:has-text("Sign In")');
    
    await expect(page).toHaveURL('/');
    
    // Click Logout (assuming a Logout button exists in Sidebar or Header)
    // Looking at common sidebar patterns in this app
    await page.click('button:has-text("Logout")');
    
    await expect(page).toHaveURL('/login');
  });
});
