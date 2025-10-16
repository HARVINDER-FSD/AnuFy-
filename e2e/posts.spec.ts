import { test, expect } from '@playwright/test';

test.describe('Posts Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/feed');
  });

  test('should create a new post', async ({ page }) => {
    await page.goto('/create/post');
    
    await page.fill('textarea[placeholder*="What\'s on your mind"]', 'This is a test post!');
    
    await page.click('button:has-text("Post")');
    
    // Should redirect to feed or show success message
    await expect(page).toHaveURL(/feed|create/);
  });

  test('should like a post', async ({ page }) => {
    await page.goto('/feed');
    
    // Wait for posts to load
    await page.waitForSelector('[data-testid="post"]', { timeout: 10000 });
    
    // Click the like button on the first post
    const likeButton = page.locator('[data-testid="like-button"]').first();
    await likeButton.click();
    
    // Should show liked state
    await expect(likeButton).toHaveClass(/liked/);
  });

  test('should comment on a post', async ({ page }) => {
    await page.goto('/feed');
    
    // Wait for posts to load
    await page.waitForSelector('[data-testid="post"]', { timeout: 10000 });
    
    // Click comment button
    const commentButton = page.locator('[data-testid="comment-button"]').first();
    await commentButton.click();
    
    // Fill comment
    await page.fill('textarea[placeholder*="Add a comment"]', 'This is a test comment!');
    await page.click('button:has-text("Comment")');
    
    // Should show the comment
    await expect(page.locator('text=This is a test comment!')).toBeVisible();
  });

  test('should navigate between tabs', async ({ page }) => {
    // Test navigation to different tabs
    await page.click('a[href="/reels"]');
    await expect(page).toHaveURL('/reels');
    
    await page.click('a[href="/search"]');
    await expect(page).toHaveURL('/search');
    
    await page.click('a[href="/profile"]');
    await expect(page).toHaveURL('/profile');
    
    await page.click('a[href="/feed"]');
    await expect(page).toHaveURL('/feed');
  });
});
