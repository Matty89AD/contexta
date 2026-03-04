import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('shows app title and CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Contexta').first()).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Start your first challenge →' })
    ).toBeVisible();
  });

  test('navigates to flow when CTA is clicked', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Start your first challenge →' }).click();
    await expect(page).toHaveURL('/flow');
  });
});
