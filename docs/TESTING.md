# Testing Guide

## Testing Overview

The project uses multiple testing frameworks:

- **Backend**: Jest
- **Frontend**: Vitest
- **ESP32**: PlatformIO test runner

## Running Tests

### All Tests

```bash
npm test
```

### Backend Tests

```bash
cd backend && npm test
```

### Frontend Tests

```bash
cd frontend && npm test
```

### ESP32 Tests

```bash
cd CNC_panel && pio test
```

## Test Structure

### Backend Tests

```
backend/__tests__/
├── controllers/
├── routes/
└── services/
```

### Frontend Tests

```
frontend/src/tests/
├── components/
├── pages/
└── utils/
```

### Writing Tests

#### Backend Test Example

```javascript
describe('Controller', () => {
  test('should return data', async () => {
    const result = await controller.getData();
    expect(result).toBeDefined();
  });
});
```

#### Frontend Test Example

```javascript
import { describe, it, expect } from 'vitest';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Test')).toBeDefined();
  });
});
```

## Coverage

### Generate Coverage Report

```bash
# Backend
cd backend && npm test -- --coverage

# Frontend
cd frontend && npm test -- --coverage
```

## Integration Testing

```bash
node test-api-integration.js
```

This tests all API endpoints.

## Notes

- No test coverage enforcement currently
- Manual testing encouraged in development
- Test API with browser developer tools