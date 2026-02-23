import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('https://www.saucedemo.com/');
  }

  async login(user: string, pass: string) {
    await this.page.fill('[data-test="username"]', user);
    await this.page.fill('[data-test="password"]', pass);
    await this.page.click('[data-test="login-button"]');
  }
}