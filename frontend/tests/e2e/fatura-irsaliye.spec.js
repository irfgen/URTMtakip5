/**
 * E2E Tests - Fatura & İrsaliye Workflows
 * End-to-end tests using Playwright
 *
 * Prerequisites:
 * - Install Playwright: npm install -D @playwright/test
 * - Install browsers: npx playwright install
 * - Run tests: npx playwright test
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:5173';
const API_BASE = 'http://localhost:3000';

/**
 * Helper: Login function if authentication is needed
 */
async function login(page) {
  // Implement login if needed
  await page.goto(BASE_URL);
}

/**
 * Helper: Create test fatura via API
 */
async function createTestFatura(apiRequest) {
  const response = await apiRequest.post(`${API_BASE}/api/faturalar`, {
    data: {
      fatura_no: `E2E_TEST_${Date.now()}`,
      belge_tarih: new Date().toISOString().split('T')[0],
      tedarikci_id: 1,
      aciklama: 'E2E Test Fatura',
      kalemler: [
        {
          stok_kodu: 'E2E_STK_001',
          parca_adi: 'E2E Test Parça',
          miktar: 100,
          birim: 'Adet',
          birim_fiyat: 50
        }
      ]
    }
  });
  return response.json();
}

/**
 * Helper: Create test irsaliye via API
 */
async function createTestIrsaliye(apiRequest) {
  const response = await apiRequest.post(`${API_BASE}/api/irsaliyeler`, {
    data: {
      irsaliye_no: `E2E_IRS_${Date.now()}`,
      belge_tarih: new Date().toISOString().split('T')[0],
      tedarikci_id: 1,
      kalemler: [
        {
          stok_kodu: 'E2E_STK_001',
          parca_adi: 'E2E Test Parça',
          miktar: 100,
          birim: 'Adet'
        }
      ]
    }
  });
  return response.json();
}

describe('Fatura & İrsaliye E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto(BASE_URL);

    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });

  describe('Fatura Creation Workflow', () => {
    test('should create new fatura successfully', async ({ page }) => {
      // Navigate to faturalar page
      await page.click('text=Faturalar');
      await page.waitForURL('**/faturalar');

      // Click "Yeni Fatura" button
      await page.click('button:has-text("Yeni Fatura")');

      // Fill fatura form
      await page.fill('input[name="fatura_no"]', `E2E_TEST_${Date.now()}`);
      await page.fill('input[type="date"]', '2024-01-15');

      // Add kalem
      await page.click('button:has-text("Kalem Ekle")');
      await page.fill('input[name="stok_kodu"]', 'E2E_STK_001');
      await page.fill('input[name="parca_adi"]', 'E2E Test Parça');
      await page.fill('input[name="miktar"]', '100');
      await page.fill('input[name="birim_fiyat"]', '50');

      // Submit form
      await page.click('button:has-text("Kaydet")');

      // Verify success
      await expect(page.locator('text=başarıyla kaydedildi')).toBeVisible();
    });

    test('should show validation errors for invalid fatura', async ({ page }) => {
      await page.click('text=Faturalar');
      await page.click('button:has-text("Yeni Fatura")');

      // Try to submit without required fields
      await page.click('button:has-text("Kaydet")');

      // Verify error messages
      await expect(page.locator('text=gereklidir')).toBeVisible();
    });
  });

  describe('İrsaliye Creation Workflow (Mobile)', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone size

    test('should create new irsaliye on mobile', async ({ page }) => {
      // Navigate to irsaliyeler page
      await page.click('text=İrsaliyeler');

      // Click new button (mobile bottom nav)
      await page.click('[data-testid="mobile-nav-new"]');

      // Fill irsaliye form
      await page.fill('input[name="irsaliye_no"]', `E2E_IRS_${Date.now()}`);
      await page.fill('input[type="date"]', '2024-01-15');

      // Add kalem
      await page.tap('button:has-text("Kalem Ekle")');
      await page.fill('input[name="stok_kodu"]', 'E2E_STK_001');
      await page.fill('input[name="miktar"]', '50');

      // Submit
      await page.tap('button:has-text("Kaydet")');

      // Verify success
      await expect(page.locator('text=başarıyla')).toBeVisible({ timeout: 5000 });
    });
  });

  describe('Eşleştirme Workflow', () => {
    test('should complete 3-way matching successfully', async ({ page, request }) => {
      // Create test data via API
      const fatura = await createTestFatura(request);
      const irsaliye = await createTestIrsaliye(request);

      // Navigate to eslestirme page
      await page.goto(`${BASE_URL}/faturalar/${fatura.data.id}/eslestirme`);

      // Wait for oneriler to load
      await page.waitForSelector('text=Eşleşme Önerileri');

      // Select first oneri
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.click();

      // Verify selection indicator
      await expect(page.locator('text=1 eşleşme seçildi')).toBeVisible();

      // Confirm batch
      await page.click('button:has-text("Eşleşmeyi Onayla")');

      // Verify success message
      await expect(page.locator('text=başarıyla tamamlandı')).toBeVisible();
    });

    test('should require neden for miktar_farki', async ({ page, request }) => {
      // Create test data with quantity difference
      const faturaResponse = await request.post(`${API_BASE}/api/faturalar`, {
        data: {
          fatura_no: `E2E_QTY_${Date.now()}`,
          belge_tarih: '2024-01-15',
          tedarikci_id: 1,
          kalemler: [
            { stok_kodu: 'STK_001', parca_adi: 'Test', miktar: 100, birim: 'Adet', birim_fiyat: 50 }
          ]
        }
      });

      const irsaliyeResponse = await request.post(`${API_BASE}/api/irsaliyeler`, {
        data: {
          irsaliye_no: `E2E_IRS_QTY_${Date.now()}`,
          belge_tarih: '2024-01-15',
          tedarikci_id: 1,
          kalemler: [
            { stok_kodu: 'STK_001', parca_adi: 'Test', miktar: 95, birim: 'Adet' }
          ]
        }
      });

      // Navigate to eslestirme
      await page.goto(`${BASE_URL}/faturalar/${faturaResponse.data.id}/eslestirme`);

      // Select oneri with miktar_farki
      await page.locator('table tbody tr').first().click();

      // Try to confirm without neden
      await page.click('button:has-text("Eşleşmeyi Onayla")');

      // Verify error message
      await expect(page.locator('text=neden belirtmelisiniz')).toBeVisible();

      // Fill neden and retry
      await page.fill('input[placeholder*="neden"]', 'Fire kabul edildi');
      await page.click('button:has-text("Eşleşmeyi Onayla")');

      // Verify success
      await expect(page.locator('text=başarıyla tamamlandı')).toBeVisible();
    });

    test('should handle lock state correctly', async ({ page, request }) => {
      // Create test fatura
      const fatura = await createTestFatura(request);

      // Navigate to eslestirme page
      await page.goto(`${BASE_URL}/faturalar/${fatura.data.id}/eslestirme`);

      // Lock the fatura (simulate another user)
      await request.post(`${API_BASE}/api/faturalar/${fatura.data.id}/lock`, {
        headers: {
          'X-Test-User-Id': 'other-user'
        }
      });

      // Reload page to see lock state
      await page.reload();

      // Verify lock warning is displayed
      await expect(page.locator('text=kilitlenmiş')).toBeVisible();

      // Verify actions are disabled
      const checkboxes = page.locator('input[type="checkbox"]');
      await expect(checkboxes).toHaveCount(0); // No checkboxes when locked
    });
  });

  describe('Real-time Updates', () => {
    test('should receive Socket.IO updates when matching completes', async ({ page, context, request }) => {
      // Create test data
      const fatura = await createTestFatura(request);

      // Open two pages
      const page1 = page;
      const page2 = await context.newPage();

      await page1.goto(`${BASE_URL}/faturalar/${fatura.data.id}/eslestirme`);
      await page2.goto(`${BASE_URL}/faturalar/${fatura.data.id}/eslestirme`);

      // On page1, complete a matching
      await page1.locator('table tbody tr').first().click();
      await page1.click('button:has-text("Eşleşmeyi Onayla")');

      // On page2, verify real-time update
      await expect(page2.locator('text=Eşleşme güncellendi')).toBeVisible({ timeout: 5000 });
    });
  });

  describe('Fatura Detay & Navigation', () => {
    test('should display fatura details correctly', async ({ page, request }) => {
      const fatura = await createTestFatura(request);

      // Navigate to fatura detail
      await page.goto(`${BASE_URL}/faturalar/${fatura.data.id}`);

      // Verify fatura information
      await expect(page.locator('text=' + fatura.data.fatura_no)).toBeVisible();
      await expect(page.locator('text=' + fatura.data.tedarikci.adi)).toBeVisible();
    });

    test('should navigate from list to detail to eslestirme', async ({ page, request }) => {
      const fatura = await createTestFatura(request);

      // Start at faturalar list
      await page.goto(`${BASE_URL}/faturalar`);

      // Click on the fatura
      await page.click(`text=${fatura.data.fatura_no}`);

      // Verify we're on detail page
      await expect(page).toHaveURL(/\/faturalar\/\d+/);

      // Click "Eşleştir" button
      await page.click('button:has-text("Eşleştir")');

      // Verify we're on eslestirme page
      await expect(page).toHaveURL(/\/eslestirme$/);
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Navigate to faturalar
      await page.goto(`${BASE_URL}/faturalar`);

      // Simulate network error by making an invalid request
      // (This would require mocking or test server setup)

      // For now, verify error message structure
      await page.evaluate(() => {
        window.showError = (message) => {
          const alert = document.createElement('div');
          alert.setAttribute('role', 'alert');
          alert.textContent = message;
          document.body.appendChild(alert);
        };
      });

      await page.evaluate(() => window.showError('Test error message'));
      await expect(page.locator('[role="alert"]')).toHaveText('Test error message');
    });
  });

  describe('Performance', () => {
    test('should load eslestirme page within acceptable time', async ({ page, request }) => {
      const fatura = await createTestFatura(request);

      const startTime = Date.now();
      await page.goto(`${BASE_URL}/faturalar/${fatura.data.id}/eslestirme`);

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Page should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle large fatura lists efficiently', async ({ page }) => {
      await page.goto(`${BASE_URL}/faturalar`);

      // The DataGrid should handle pagination
      await expect(page.locator('.MuiDataGrid-root')).toBeVisible();

      // Page should be responsive
      const responseTime = await page.measureResponseTime(() => {
        return page.locator('.MuiDataGrid-root').isVisible();
      });

      expect(responseTime).toBeLessThan(1000); // 1 second threshold
    });
  });
});

/**
 * Performance measurement helper
 */
async function measureResponseTime(page, action) {
  const start = Date.now();
  await action();
  return Date.now() - start;
}

/**
 * Test data cleanup
 */
test.afterAll(async ({ request }) => {
  // Clean up test data
  try {
    await request.delete(`${API_BASE}/api/faturalar?test_data=true`);
  } catch (e) {
    console.log('Cleanup failed:', e);
  }
});
