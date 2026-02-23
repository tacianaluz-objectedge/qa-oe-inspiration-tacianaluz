import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, 
  workers: 1,           
  retries: 1,          
  reporter: [['html'], ['list']], 

  use: {
    baseURL: 'https://www.saucedemo.com',
    trace: 'on',                
    screenshot: 'on',           
    video: 'retain-on-failure', 
    headless: false,            
  },

  projects: [
    {
      name: 'Chromium - Google Chrome',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
});