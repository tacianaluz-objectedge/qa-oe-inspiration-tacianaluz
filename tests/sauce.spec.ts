import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test.describe('SauceDemo Suite', () => {
  test.describe.configure({ mode: 'serial' });
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test.describe('Authentication & System Performance', () => {
    
    test('Standard User', async ({ page }) => {
      await loginPage.navigate();
      await loginPage.login('standard_user', 'secret_sauce');
      await expect(page).toHaveURL(/inventory.html/);
      await expect(page.locator('.title')).toHaveText('Products');
    });

    test('Error Handling (Locked User)', async ({ page }) => {
      await loginPage.navigate();
      await loginPage.login('locked_out_user', 'secret_sauce');
      const errorContainer = page.locator('[data-test="error"]');
      await expect(errorContainer).toBeVisible();
      await expect(errorContainer).toContainText('Sorry, this user has been locked out');
    });

    test('Latency Resilience (SLA Glitch User)', async ({ page }) => {
      await loginPage.navigate();
      const startTime = Date.now();
      await loginPage.login('performance_glitch_user', 'secret_sauce');
      await page.waitForLoadState('networkidle');
      const duration = Date.now() - startTime;
      console.log(`Latency User Login Duration: ${duration}ms`);
      expect(duration, 'O sistema ultrapassou o tempo limite de SLA').toBeLessThan(8000); 
      await expect(page).toHaveURL(/inventory.html/);
      const productImages = page.locator('.inventory_item_img');
      await expect(productImages.first()).toBeVisible();
      const productCount = await productImages.count();
      expect(productCount).toBeGreaterThan(0);
    });
  });

  
  test.describe('Purchase Flow & Business Logic', () => {
    
    test.beforeEach(async ({ page }) => {
        await loginPage.navigate();
        await loginPage.login('standard_user', 'secret_sauce');
    });

    test('TC1: Product Sorting Accuracy (Low to High)', async ({ page }) => {
        const expectedPrices = [7.99, 9.99, 15.99, 15.99, 29.99, 49.99];
        await expect(page.locator('.inventory_list')).toBeVisible();
        await page.selectOption('.product_sort_container', 'lohi');   
        await expect(page.locator('.active_option')).toHaveText('Price (low to high)');
        const priceElements = await page.locator('.inventory_item_price').allInnerTexts();
        const numericPrices = priceElements.map(p => parseFloat(p.replace('$', '')));
        expect(numericPrices.length).toBe(expectedPrices.length);
        for (let i = 0; i < numericPrices.length; i++) {
            expect(numericPrices[i], `Price at index ${i} should be exactly ${expectedPrices[i]}`)
            .toBe(expectedPrices[i]);
        }
        for (let i = 0; i < numericPrices.length - 1; i++) {
            expect(numericPrices[i], `Price ${numericPrices[i]} must be <= to the next price ${numericPrices[i+1]}`)
            .toBeLessThanOrEqual(numericPrices[i + 1]);
        }
    });

    test('TC2: End-to-End Flow - Multi-Item Purchase and Calculation Verification', async ({ page }) => {
        const items = [
            { id: 'sauce-labs-onesie', name: 'Sauce Labs Onesie', price: 7.99 },
            { id: 'sauce-labs-bike-light', name: 'Sauce Labs Bike Light', price: 9.99 }
        ];

        for (const item of items) {
            await page.click(`[data-test="add-to-cart-${item.id}"]`);
        }

        const badge = page.locator('.shopping_cart_badge');
        await expect(badge).toHaveText(items.length.toString());
        await page.click('.shopping_cart_link');

        for (let i = 0; i < items.length; i++) {
            const cartItem = page.locator('.cart_item').nth(i);
            await expect(cartItem.locator('.inventory_item_name')).toHaveText(items[i].name);
            await expect(cartItem.locator('.inventory_item_price')).toHaveText(`$${items[i].price}`);
            await expect(cartItem.locator('.cart_quantity')).toHaveText('1');
        }

        await page.click('[data-test="checkout"]');
        await page.fill('[data-test="firstName"]', 'Taciana');
        await page.fill('[data-test="lastName"]', 'Luz');
        await page.fill('[data-test="postalCode"]', '12345');
        await page.click('[data-test="continue"]');
        await expect(page).toHaveURL(/checkout-step-two.html/);
        const subtotalValue = items.reduce((sum, item) => sum + item.price, 0);
        const subtotalLocator = page.locator('.summary_subtotal_label');
        await expect(subtotalLocator).toContainText(`Item total: $${subtotalValue}`);
        const taxText = await page.locator('.summary_tax_label').innerText();
        const taxValue = parseFloat(taxText.replace('Tax: $', ''));
        const totalValue = Number((subtotalValue + taxValue).toFixed(2));
        await expect(page.locator('.summary_total_label')).toContainText(`Total: $${totalValue}`);
        await page.click('[data-test="finish"]');
        await expect(page.locator('.complete-header')).toHaveText('Thank you for your order!');
        await expect(page.locator('.pony_express')).toBeVisible();
        await expect(badge).not.toBeVisible();
 });

    test('TC3: Data Integrity - Cart Persistence & Removal Lifecycle', async ({ page }) => {
      await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');
      const badge = page.locator('.shopping_cart_badge');
      await expect(badge).toHaveText('1');
      await page.click('text=Sauce Labs Backpack');
      await page.waitForLoadState('domcontentloaded');
      await expect(badge).toHaveText('1');
      const removeBtn = page.locator('[data-test="remove"]');
      await expect(removeBtn).toHaveText('Remove');
      await removeBtn.click();
      await expect(badge).not.toBeVisible();
      await expect(page.locator('[data-test="add-to-cart"]')).toBeVisible();
    });

    test('TC4: Financial Audit - Advanced Dynamic Tax & Price Integrity Validation', async ({ page }) => {
        const productSelectors = [
            { id: 'backpack', name: 'Sauce Labs Backpack' },
            { id: 'bolt-t-shirt', name: 'Sauce Labs Bolt T-Shirt' }
        ];
        const capturedInventory: { name: string, price: number }[] = [];
        for (const item of productSelectors) {
            const productLocator = page.locator('.inventory_item').filter({ hasText: item.name });
            const priceText = await productLocator.locator('.inventory_item_price').innerText();
            const priceValue = parseFloat(priceText.replace('$', ''));
            expect(priceValue, `Price for ${item.name} should be a positive number`).toBeGreaterThan(0);
            
            capturedInventory.push({ name: item.name, price: priceValue });
            await page.click(`[data-test="add-to-cart-sauce-labs-${item.id}"]`);
        }

        await page.click('.shopping_cart_link');
        await page.click('[data-test="checkout"]');
        await page.fill('[data-test="firstName"]', 'Taciana');
        await page.fill('[data-test="lastName"]', 'Luz');
        await page.fill('[data-test="postalCode"]', '12345');
        await page.click('[data-test="continue"]');

        for (const item of capturedInventory) {
            const summaryItem = page.locator('.cart_item').filter({ hasText: item.name });
            const summaryPriceText = await summaryItem.locator('.inventory_item_price').innerText();
            const summaryPriceValue = parseFloat(summaryPriceText.replace('$', ''));
            expect(summaryPriceValue, `Price for ${item.name} in summary must match initial showcase price`).toBe(item.price);
        }

        const subtotalText = await page.locator('.summary_subtotal_label').innerText();
        const taxText = await page.locator('.summary_tax_label').innerText();
        const totalText = await page.locator('.summary_total_label').innerText();
        const subtotalUI = parseFloat(subtotalText.replace('Item total: $', ''));
        const taxUI = parseFloat(taxText.replace('Tax: $', ''));
        const totalUI = parseFloat(totalText.replace('Total: $', ''));
        const expectedSubtotal = capturedInventory.reduce((sum, item) => sum + item.price, 0);
        expect(subtotalUI, 'Subtotal in UI must strictly match the sum of individual captured prices').toBe(expectedSubtotal);
        const expectedTax = Number((subtotalUI * 0.08).toFixed(2));
        expect(taxUI, 'Tax should be consistent with the application logic (~8%)').toBeCloseTo(expectedTax, 1);
        const calculatedTotal = Number((subtotalUI + taxUI).toFixed(2));
        expect(totalUI, `Final Total (${totalUI}) must be exactly Subtotal (${subtotalUI}) + Tax (${taxUI})`).toBe(calculatedTotal);
        await page.click('[data-test="finish"]');
        await expect(page.locator('.complete-header')).toHaveText('Thank you for your order!');
        });
   });
});