<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# ÜRTM Takip Sistemi - Agent Instructions

This is a full-stack manufacturing tracking system with Node.js backend and React frontend.

## Build, Lint, and Test Commands

### Root Commands
```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend (development)
npm run dev

# Start production servers
npm run start

# Build frontend for production
npm run build
```

### Backend (Node.js + Express + Sequelize)
```bash
cd backend

# Development server with hot reload
npm run dev

# Production server
npm start

# Run all tests
npm test

# Run single test file
npm test -- backend/src/tests/routes/irsaliyeAnaliz.test.js

# Run tests matching pattern
npm test -- --testPathPattern="irsaliye"

# Run tests with coverage
npm test -- --coverage

# Database migrations
npm run migrate
```

### Frontend (React + Vite + Material-UI)
```bash
cd frontend

# Development server (port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run all tests
npm test

# Run single test file
npm test -- frontend/tests/services/api.test.js

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm test -- --ui
```

## Code Style Guidelines

### Backend (Node.js)

**Imports**
- Use CommonJS `require()` syntax
- Order: Node modules → Internal modules → Config/Utils
- Group related imports together

```javascript
const express = require('express');
const { Op } = require('sequelize');
const IsEmri = require('../models/IsEmri');
const StatusUtils = require('../utils/statusUtils');
```

**Naming Conventions**
- Variables: camelCase (e.g., `isEmri`, `tezgahListesi`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- Classes/Models: PascalCase (e.g., `IsEmri`, `Tezgah`)
- Files: camelCase for logic, PascalCase for models
- Database tables: snake_case (e.g., `is_emirleri`, `tezgahlar`)

**Error Handling**
- Always use try-catch in async route handlers
- Use custom `AppError` class from `../utils/errors`
- Include descriptive error messages in Turkish
- Log errors with Winston logger for debugging

```javascript
const { AppError } = require('../utils/errors');

try {
  const result = await SomeModel.create(data);
  res.json({ success: true, data: result });
} catch (error) {
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }
  throw new AppError('İşlem sırasında hata oluştu', 500);
}
```

**Controllers**
- Export named functions using `exports.functionName = async (req, res) => {}`
- Validate input early (400 Bad Request for invalid input)
- Return consistent response format: `{ success: boolean, data?: any, error?: string }`

**Models (Sequelize)**
- Extend Sequelize Model class
- Define `associate()` static method for relationships
- Use `DataTypes` for type definitions
- Add table options (timestamps, tableName in Turkish)

### Frontend (React + Redux)

**Imports**
- Use ES6 `import` syntax
- Order: React → External libraries → Internal modules → Styles

```javascript
import React from 'react';
import { useState, useEffect } from 'react';
import { Button, Box, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchIsEmirleri } from '../store/slices/isEmirleriSlice';
import './MyComponent.css';
```

**Component Structure**
- Use functional components with hooks
- Use Material-UI styled components for styles
- Export named components or default as needed

```javascript
import React from 'react';
import { Button, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  padding: theme.spacing(1, 2),
}));

export const MyComponent = ({ prop1, prop2 }) => {
  return (
    <Box>
      <StyledButton variant="contained">Click me</StyledButton>
    </Box>
  );
};

export default MyComponent;
```

**Redux Toolkit**
- Use `createSlice` for state management
- Use `createAsyncThunk` for async actions
- Follow the pattern: slice file → exported actions/thunks → imported in components

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchItems = createAsyncThunk(
  'items/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/items', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const itemsSlice = createSlice({
  name: 'items',
  initialState: { data: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchItems.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchItems.fulfilled, (state, action) => {
      state.loading = false;
      state.data = action.payload;
    });
  },
});

export default itemsSlice.reducer;
```

**Testing**
- Use `vitest` for unit tests, `vitest --ui` for visual testing
- Mock external dependencies (axios, Redux store)
- Use `describe` blocks for grouping related tests
- Test file naming: `*.test.js` or `*.test.jsx`

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

**Mobile-First Development**
- Use `@/components/mobile/TouchButton` for touch interactions
- Minimum touch target: 44px
- Use Material-UI responsive breakpoints
- Test on mobile viewport (375px - 414px width)

## Project Structure

```
URTMtakip/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── models/          # Sequelize models
│   │   ├── routes/          # Express routes
│   │   ├── middleware/      # Custom middleware
│   │   ├── socket/          # Socket.IO namespaces
│   │   └── tests/           # Jest tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Redux store
│   │   ├── services/        # API services
│   │   ├── hooks/           # Custom hooks
│   │   └── tests/           # Vitest tests
│   └── package.json
└── package.json
```

## Port Configuration
- **Frontend**: 5173 (fixed, don't change)
- **Backend**: 3000 (fixed, don't change)

## Key Technologies
- Backend: Node.js, Express, Sequelize, SQLite, Socket.IO, Winston
- Frontend: React 18, Vite, Material-UI, Redux Toolkit, Vitest
- Testing: Jest (backend), Vitest (frontend), Supertest
- Real-time: Socket.IO for live updates
- AI Integration: Claude Agent SDK, Claude Code CLI

## AI Integration (Claude Code & SDK)

### Claude Code CLI
Claude Code CLI zaten kurulu ve kullanıma hazır:
```bash
cd backend
claude --print --permission-mode bypassPermissions "prompt here"
```

### Claude Agent SDK
`@anthropic-ai/claude-agent-sdk@0.2.126` backend'e kurulu:
```javascript
const sdk = require('@anthropic-ai/claude-agent-sdk');
// SDK fonksiyonlarını kullan
```

**Test Dosyası:** `backend/claude-sdk-test.js`
**Dokümantasyon:** `backend/CLAUDE_AGENT_SDK.md`

**API Key Gerekli:** `.env` dosyasına `ANTHROPIC_API_KEY=sk-...` ekleyin.

### Coding Agent Kullanımı
OpenClaw coding-agent skill ile Claude Code'a görev delege edilebilir.
