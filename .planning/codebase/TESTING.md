---
name: TESTING.md
description: Testing framework, structure, mocking, and coverage
type: codebase
---

# Testing

## Test Frameworks

### Backend
- **Jest**: 29.7.0
- **Supertest**: 6.3.3 (API testing)

### Frontend
- **Vitest**: 1.0.2
- **React Testing Library**: 14.1.2

## Test Structure

### Backend Tests
```
backend/src/tests/
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

## Running Tests

### Backend
```bash
cd backend && npm test
```

### Frontend
```bash
cd frontend && npm test
```

## Integration Testing

```bash
# Test all API endpoints
node test-api-integration.js
```

## Notes

- No test coverage enforcement currently
- Minimal test coverage
- Manual testing encouraged in development