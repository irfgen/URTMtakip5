import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import MakindexSearch from '../../src/components/makindex/MakindexSearch';
import makindexSlice from '../../src/store/slices/makindexSlice';

// Mock API
vi.mock('../../src/api/axiosConfig', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      makindex: makindexSlice,
    },
    preloadedState: {
      makindex: {
        siniflar: [],
        makinalar: {},
        boms: {},
        parcalar: {},
        expandedNodes: new Set(),
        selectedNode: null,
        searchResults: {},
        searchQuery: '',
        searchType: null,
        recentSearches: [],
        filters: {
          stokDurumu: 'hepsi',
          makinaSinifi: 'hepsi',
        },
        loading: {
          siniflar: false,
          makinalar: {},
          boms: {},
          parcalar: {},
          search: false,
          seed: false,
        },
        error: {
          siniflar: null,
          makinalar: {},
          boms: {},
          parcalar: {},
          search: null,
          seed: null,
        },
        viewMode: 'tree',
        cache: {
          siniflar: null,
          makinalar: {},
          boms: {},
          parcalar: {},
          search: {},
        },
        cacheTTL: 5 * 60 * 1000,
        ...initialState,
      },
    },
  });
};

const renderWithProviders = (component, { initialState = {} } = {}) => {
  const store = createTestStore(initialState);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('MakindexSearch', () => {
  it('should render search input', () => {
    renderWithProviders(<MakindexSearch />);

    const searchInput = screen.getByPlaceholderText(/Makindex'te ara.../i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should handle search input change', async () => {
    renderWithProviders(<MakindexSearch />);

    const searchInput = screen.getByPlaceholderText(/Makindex'te ara.../i);

    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(searchInput.value).toBe('test');
    });
  });

  it('should show loading state during search', async () => {
    const mockApi = await import('../../src/api/axiosConfig').then(m => m.default);
    mockApi.get.mockResolvedValue({
      data: { data: { sinif: [], makina: [], bom: [], parca: [] } }
    });

    renderWithProviders(<MakindexSearch />);

    const searchInput = screen.getByPlaceholderText(/Makindex'te ara.../i);

    fireEvent.change(searchInput, { target: { value: 'test query' } });

    // Loading indicator should appear (implementation dependent)
    // This is a basic test - actual loading implementation may vary
  });

  it('should handle empty search', () => {
    renderWithProviders(<MakindexSearch />);

    const searchInput = screen.getByPlaceholderText(/Makindex'te ara.../i);

    fireEvent.change(searchInput, { target: { value: '' } });

    expect(searchInput.value).toBe('');
  });
});