/**
 * Test Utilities
 * Helper functions and factories for testing
 */

import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';

/**
 * Create a mock Redux store with optional preloaded state
 */
export function createMockStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      auth: (state = { user: { id: 'test-user', personel_adi: 'Test User' } }) => state,
      fatura: (state = {}) => state,
      irsaliye: (state = {}) => state,
      eslestirme: (state = {}) => state,
      tezgah: (state = {}) => state
    },
    preloadedState
  });
}

/**
 * Wrapper component for Redux + Router
 */
export function WithProviders({ children, store, initialEntries = ['/'] }) {
  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </Provider>
  );
}

/**
 * Custom render function with providers
 */
export function renderWithProviders(ui, {
  preloadedState = {},
  store = createMockStore(preloadedState),
  initialEntries = ['/'],
  ...renderOptions
} = {}) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </Provider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    store
  };
}

/**
 * Mock Fatura data factory
 */
export function createMockFatura(overrides = {}) {
  return {
    id: 1,
    fatura_no: 'FTR2024001',
    belge_tarih: '2024-01-15',
    vade_tarihi: '2024-02-15',
    tedarikci_id: 1,
    tedarikci: { id: 1, adi: 'Test Tedarikçi', firma_adi: 'Test Firma A.Ş.' },
    durum: 'bekliyor',
    aciklama: 'Test açıklama',
    toplam_kalem: 2,
    toplam_miktar: 150,
    genel_toplam: 7500.00,
    kalemler: [],
    lockState: { state: 'UNLOCKED' },
    olusturan: { id: 'user1', personel_adi: 'Test User' },
    ...overrides
  };
}

/**
 * Mock Fatura Kalem data factory
 */
export function createMockFaturaKalem(overrides = {}) {
  return {
    id: 1,
    fatura_id: 1,
    stok_kodu: 'STK001',
    parca_adi: 'Test Parça',
    miktar: 100,
    birim: 'Adet',
    birim_fiyat: 50.00,
    toplam_tutar: 5000.00,
    eslesme_durumu: 0,
    eslesen_irsaliye_kalem: null,
    ...overrides
  };
}

/**
 * Mock İrsaliye data factory
 */
export function createMockIrsaliye(overrides = {}) {
  return {
    id: 1,
    irsaliye_no: 'IRS2024001',
    belge_tarih: '2024-01-10',
    tedarikci_id: 1,
    tedarikci: { id: 1, adi: 'Test Tedarikçi', firma_adi: 'Test Firma A.Ş.' },
    aciklama: 'Test irsaliye açıklama',
    toplam_kalem: 2,
    lockState: { state: 'UNLOCKED' },
    kalemler: [],
    ...overrides
  };
}

/**
 * Mock İrsaliye Kalem data factory
 */
export function createMockIrsaliyeKalem(overrides = {}) {
  return {
    id: 1,
    irsaliye_id: 1,
    stok_kodu: 'STK001',
    parca_adi: 'Test Parça',
    miktar: 100,
    birim: 'Adet',
    ...overrides
  };
}

/**
 * Mock Eşleştirme Önerisi data factory
 */
export function createMockEslestirmeOneri(overrides = {}) {
  return {
    faturaKalem: createMockFaturaKalem(),
    irsaliyeKalem: createMockIrsaliyeKalem(),
    irsaliye: createMockIrsaliye(),
    tedarikci: { id: 1, adi: 'Test Tedarikçi' },
    miktarFarki: 0,
    eslesmeTipi: 'tam',
    ...overrides
  };
}

/**
 * Mock Lock State factory
 */
export function createMockLockState(state = 'UNLOCKED', overrides = {}) {
  const states = {
    UNLOCKED: { state: 'UNLOCKED' },
    LOCKED_BY_ME: {
      state: 'LOCKED_BY_ME',
      lockedBy: { id: 'user1', personel_adi: 'Test User' },
      lockedAt: new Date().toISOString()
    },
    LOCKED_BY_OTHER: {
      state: 'LOCKED_BY_OTHER',
      lockedBy: { id: 'user2', personel_adi: 'Other User' },
      lockedAt: new Date().toISOString()
    },
    LOCK_EXPIRED: {
      state: 'LOCK_EXPIRED',
      lockedBy: { id: 'user1', personel_adi: 'Test User' },
      lockedAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    }
  };

  return {
    ...states[state],
    ...overrides
  };
}

/**
 * Mock API response factory
 */
export function createMockResponse(data, status = 200) {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config: {}
  };
}

/**
 * Mock API error factory
 */
export function createMockErrorResponse(message, status = 400) {
  const error = new Error(message);
  error.response = {
    data: { error: message },
    status,
    statusText: status === 400 ? 'Bad Request' : 'Error'
  };
  return error;
}

/**
 * Wait for async operations to complete
 */
export function wait(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for element to appear in DOM
 */
export async function waitForElement(getElement, options = {}) {
  const { timeout = 1000 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const element = getElement();
      if (element) {
        return element;
      }
    } catch (e) {
      // Element not found yet
    }
    await wait(50);
  }

  throw new Error(`Element not found within ${timeout}ms`);
}

/**
 * Mock Socket.IO client factory
 */
export function createMockSocket() {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
    connected: false,
    id: 'test-socket-id'
  };

  // Simulate connection
  mockSocket.connect.mockImplementation(() => {
    mockSocket.connected = true;
  });

  // Simulate event emission
  mockSocket.emit.mockImplementation((event, data, callback) => {
    if (callback) callback({ success: true });
  });

  return mockSocket;
}

/**
 * Mock IntersectionObserver for lazy loading tests
 */
export function createMockIntersectionObserver() {
  return {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  };
}

/**
 * Generate mock user event for form inputs
 */
export function createInputEvent(value) {
  return {
    target: { value }
  };
}

/**
 * Generate mock file for upload tests
 */
export function createMockFile(filename, size = 1024, type = 'text/plain') {
  const file = new File([''], filename, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

/**
 * Test data generators for bulk testing
 */
export const testDataGenerators = {
  faturalar: (count = 10) =>
    Array.from({ length: count }, (_, i) =>
      createMockFatura({
        id: i + 1,
        fatura_no: `FTR2024${String(i + 1).padStart(3, '0')}`
      })
    ),

  irsaliyeler: (count = 10) =>
    Array.from({ length: count }, (_, i) =>
      createMockIrsaliye({
        id: i + 1,
        irsaliye_no: `IRS2024${String(i + 1).padStart(3, '0')}`
      })
    ),

  eslestirmeOneriler: (count = 5) =>
    Array.from({ length: count }, (_, i) =>
      createMockEslestirmeOneri({
        faturaKalem: createMockFaturaKalem({ id: i + 1 }),
        irsaliyeKalem: createMockIrsaliyeKalem({ id: i + 1 })
      })
    )
  };
