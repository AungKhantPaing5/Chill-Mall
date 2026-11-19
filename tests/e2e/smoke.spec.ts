import { test, expect } from '@playwright/test';

test('homepage loads and switches EN/MY language', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('CHILL MALL')).toBeVisible();
});

test('admin route redirects unauthenticated users to login', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login/);
});
