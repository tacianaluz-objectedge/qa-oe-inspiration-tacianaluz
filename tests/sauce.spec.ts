import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test('Should complete a basic purchase flow', async ({ page }) => {
  const login = new LoginPage(page);

  // Step 1: Login
  await login.navigate();
  await login.login('standard_user', 'secret_sauce');
  await expect(page).toHaveURL(/inventory.html/);

  // Step 2: Add item to cart
  await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
  
  // Step 3: Verify cart badge
  const cartBadge = page.locator('.shopping_cart_badge');
  await expect(cartBadge).toHaveText('1');

  // Step 4: Go to cart
  await page.click('.shopping_cart_link');
  await expect(page).toHaveURL(/cart.html/);
  await expect(page.locator('.inventory_item_name')).toContainText('Sauce Labs Backpack');
});