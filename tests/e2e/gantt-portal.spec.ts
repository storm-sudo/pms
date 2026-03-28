import { test, expect } from '@playwright/test';

test.describe('Gantt Timeline Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'shahebaazkazi002nt@gmail.com');
    await page.fill('#password', 'dmin123');
    await page.click('button:has-text("Sign In")');
  });

  test('should render Gantt chart and allow interaction', async ({ page }) => {
    await page.goto('/timeline');
    
    // Verify Gantt view rendered
    await expect(page.locator('canvas')).toBeVisible(); // Gantt often uses canvas or SVG
    
    // If it's the custom component we built:
    await expect(page.locator('.gantt-container')).toBeVisible();
    
    // Check if tasks are listed in the side area of Gantt
    await expect(page.locator('text=Research Project')).toBeVisible();
    
    // Drag and drop validation (simulated)
    const taskBar = page.locator('.gantt-bar').first();
    await expect(taskBar).toBeVisible();
    
    // Resize validation (simulated)
    const resizeHandle = taskBar.locator('.resize-handle-right');
    await expect(resizeHandle).toBeVisible();
  });

  test('should snap back on Supabase write failure', async ({ page }) => {
    await page.goto('/timeline');
    
    // Simulate network failure for any Supabase update
    await page.route('**/rest/v1/tasks*', route => route.abort('failed'));
    
    const taskBar = page.locator('.gantt-bar').first();
    const initialBox = await taskBar.boundingBox();
    
    // Attempt Drag
    await taskBar.dragTo(page.locator('.gantt-container'), { targetPosition: { x: 500, y: 100 } });
    
    // Verify Snap-back (should be at initial position)
    const finalBox = await taskBar.boundingBox();
    expect(finalBox?.x).toBe(initialBox?.x);
    
    // Verify Error Toast
    await expect(page.locator('text=Synchronization Failed')).toBeVisible();
  });
});

test.describe('Stakeholder Portal Interaction', () => {
  test('should allow stakeholders to view reports and provide feedback', async ({ page }) => {
    // Stakeholder login (often different path or bypassed domain as per Sprint 4)
    await page.goto('/login');
    await page.fill('#email', 'stakeholder@external.com');
    await page.fill('#password', 'password123');
    await page.click('button:has-text("Sign In")');
    
    // Verify redirection to portal
    await expect(page).toHaveURL(/\/portal/);
    await expect(page.locator('h1')).toContainText('Stakeholder Portal');
    
    // View a published report
    await page.click('text=View Report');
    await expect(page.locator('.report-content')).toBeVisible();
    
    // Submit Feedback
    const feedbackBox = page.locator('textarea[placeholder*="feedback"]');
    await feedbackBox.fill('Clinical data looks promising. Please clarify Week 12 metrics.');
    await page.click('button:has-text("Submit Feedback")');
    
    // Verify success toast
    await expect(page.locator('text=Feedback Submitted')).toBeVisible();
  });
});
