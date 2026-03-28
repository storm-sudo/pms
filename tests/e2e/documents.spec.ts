import { test, expect } from '@playwright/test';

test.describe('Clinical Document Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'shahebaazkazi002nt@gmail.com');
    await page.fill('#password', 'dmin123');
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL('/');
  });

  test('should upload, version, and approve a protocol', async ({ page }) => {
    await page.click('nav >> text=Projects');
    
    // Navigate to a project's documents (e.g., via dropdown or direct link)
    // For simplicity in test, we'll try to find a "Documents" button in a card
    await page.click('button:has-text("Documents")'); // Assuming a button exists or we navigate directly
    
    // Upload Protocol
    await page.click('button:has-text("Upload Protocol")');
    await page.setInputFiles('input[type="file"]', {
      name: 'clinical_protocol_v1.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake pdf content')
    });
    
    await page.click('button:has-text("Commit to Laboratory Repository")');
    
    // Verify upload
    await expect(page.locator('text=clinical_protocol_v1.pdf')).toBeVisible();
    await expect(page.locator('text=pending')).toBeVisible();
    
    // Approve Protocol (as Admin)
    await page.click('button:has(svg.lucide-more-vertical)');
    await page.click('text=Finalize Audit (Approve)');
    
    await expect(page.locator('text=approved')).toBeVisible();
    
    // Versioning: Commit New Version
    await page.click('button:has(svg.lucide-more-vertical)');
    await page.click('text=Commit New Version');
    
    await page.setInputFiles('input[type="file"]', {
      name: 'clinical_protocol_v2.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake pdf content v2')
    });
    await page.click('button:has-text("Commit to Laboratory Repository")');
    
    // Verify version increase
    await expect(page.locator('text=v2.0')).toBeVisible();
  });
});
