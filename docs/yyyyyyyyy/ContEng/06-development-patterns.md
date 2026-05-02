# Development Guidelines and Patterns - ÜRTM Takip

## Overview

This document outlines the development patterns, coding standards, architectural decisions, and best practices used throughout the ÜRTM Takip project. Following these guidelines ensures consistency, maintainability, and scalability across the manufacturing tracking system.

## Project Philosophy

### Core Principles
1. **Manufacturing-First Design**: All features designed with production floor requirements in mind
2. **Mobile-Responsive Architecture**: Equal priority for desktop and mobile experiences
3. **Real-time Operations**: Live updates critical for production tracking
4. **Data Integrity**: Manufacturing data requires absolute accuracy and audit trails
5. **Performance at Scale**: System must handle high-frequency production data
6. **Maintainability**: Code should be self-documenting and easy to extend

## Development Environment Setup

### Prerequisites
```bash
# Node.js version management
nvm use 18.17.0

# Package manager
npm --version # Should be 9.x or higher

# Database
sqlite3 --version # For database management
```

### Development Commands
```bash
# Full application development
npm run install:all        # Install all dependencies
npm run dev                # Start both backend and frontend

# Backend development
cd backend && npm run dev   # Nodemon with hot reload
cd backend && npm start     # Production mode

# Frontend development  
cd frontend && npm run dev  # Vite dev server with HMR
cd frontend && npm run build # Production build
```

### Environment Configuration
```bash
# Backend environment variables
NODE_ENV=development
PORT=3001
DB_PATH=./database.sqlite

# Frontend environment variables
REACT_APP_API_URL=http://localhost:3001
REACT_APP_SOCKET_URL=http://localhost:3001
```

## Backend Development Patterns

### 1. Project Structure Conventions

```
backend/src/
├── config/             # Configuration files
├── controllers/        # Business logic layer
├── middleware/         # Express middleware
├── models/            # Sequelize models
├── routes/            # Route definitions
├── services/          # External service integrations
├── utils/             # Shared utilities
├── migrations/        # Database migrations
└── index.js          # Application entry point
```

### 2. Model Definition Patterns

**Standard Model Structure:**
```javascript
// models/ExampleModel.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ExampleModel = sequelize.define('ExampleModel', {
    // Primary key
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Required fields
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    
    // Optional fields with defaults
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    },
    
    // JSON fields for flexible data
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    
    // Soft delete support
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    // Model options
    tableName: 'example_models',
    timestamps: true,
    paranoid: true, // Enables soft deletes
    indexes: [
      { fields: ['name'] },
      { fields: ['status'] }
    ],
    
    // Instance methods
    instanceMethods: {
      getDisplayName() {
        return `${this.name} (${this.id})`;
      }
    },
    
    // Class methods
    classMethods: {
      async findByStatus(status) {
        return this.findAll({ where: { status } });
      }
    }
  });
  
  // Associations defined in models/index.js
  ExampleModel.associate = (models) => {
    ExampleModel.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };
  
  return ExampleModel;
};
```

### 3. Controller Patterns

**Standard Controller Structure:**
```javascript
// controllers/exampleController.js
const { ExampleModel } = require('../models');
const { validationResult } = require('express-validator');

class ExampleController {
  // GET /api/examples
  async list(req, res) {
    try {
      const { page = 1, limit = 20, search, status } = req.query;
      
      const where = {};
      if (search) {
        where.name = { [Op.iLike]: `%${search}%` };
      }
      if (status) {
        where.status = status;
      }
      
      const options = {
        where,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['createdAt', 'DESC']],
        include: [{ model: User, as: 'user' }]
      };
      
      const { rows: items, count } = await ExampleModel.findAndCountAll(options);
      
      res.json({
        success: true,
        data: items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Error in ExampleController.list:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
  
  // POST /api/examples
  async create(req, res) {
    try {
      // Validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      
      const item = await ExampleModel.create(req.body);
      
      // Emit real-time update
      req.io.emit('exampleCreated', item);
      
      res.status(201).json({
        success: true,
        data: item
      });
    } catch (error) {
      console.error('Error in ExampleController.create:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create item'
      });
    }
  }
  
  // PUT /api/examples/:id
  async update(req, res) {
    try {
      const { id } = req.params;
      
      const item = await ExampleModel.findByPk(id);
      if (!item) {
        return res.status(404).json({
          success: false,
          error: 'Item not found'
        });
      }
      
      await item.update(req.body);
      
      // Emit real-time update
      req.io.emit('exampleUpdated', item);
      
      res.json({
        success: true,
        data: item
      });
    } catch (error) {
      console.error('Error in ExampleController.update:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update item'
      });
    }
  }
}

module.exports = new ExampleController();
```

### 4. Route Definition Patterns

```javascript
// routes/exampleRoutes.js
const express = require('express');
const { body } = require('express-validator');
const exampleController = require('../controllers/exampleController');

const router = express.Router();

// Validation middleware
const validateExample = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 255 })
    .withMessage('Name must be less than 255 characters'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive')
];

// Routes
router.get('/', exampleController.list);
router.post('/', validateExample, exampleController.create);
router.get('/:id', exampleController.getById);
router.put('/:id', validateExample, exampleController.update);
router.delete('/:id', exampleController.delete);

module.exports = router;
```

### 5. Error Handling Patterns

**Global Error Handler:**
```javascript
// middleware/errorHandler.js
const winston = require('winston');

const errorHandler = (err, req, res, next) => {
  // Log error
  winston.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: req.user?.id
  });
  
  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }
  
  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      error: 'Duplicate entry',
      field: err.errors[0]?.path
    });
  }
  
  // Default error response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
};

module.exports = errorHandler;
```

### 6. File Upload Patterns

```javascript
// middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');

const createUploadMiddleware = (destination, allowedTypes = []) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      // Turkish character cleanup
      const cleanName = file.originalname
        .replace(/[çÇ]/g, 'c')
        .replace(/[ğĞ]/g, 'g')
        .replace(/[ıİ]/g, 'i')
        .replace(/[öÖ]/g, 'o')
        .replace(/[şŞ]/g, 's')
        .replace(/[üÜ]/g, 'u')
        .replace(/[^a-zA-Z0-9.-]/g, '_');
      
      const timestamp = Date.now();
      const ext = path.extname(cleanName);
      const name = path.basename(cleanName, ext);
      
      cb(null, `${name}_${timestamp}${ext}`);
    }
  });
  
  const fileFilter = (req, file, cb) => {
    if (allowedTypes.length === 0 || allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`));
    }
  };
  
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 100 * 1024 * 1024 // 100MB
    }
  });
};

module.exports = { createUploadMiddleware };
```

## Frontend Development Patterns

### 7. Component Structure Conventions

```
components/
├── shared/           # Reusable components
├── layout/          # Layout components
├── forms/           # Form components
├── mobile/          # Mobile-specific components
└── [Feature]/       # Feature-specific components
  ├── [Feature]List.jsx
  ├── [Feature]Card.jsx
  ├── [Feature]Form.jsx
  └── [Feature]Modal.jsx
```

### 8. React Component Patterns

**Functional Component Template:**
```jsx
// components/Example/ExampleCard.jsx
import React, { useState, useCallback, memo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Box
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { updateExample } from '../../store/slices/exampleSlice';

const ExampleCard = memo(({ item, onEdit, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  
  const handleStatusToggle = useCallback(async () => {
    setLoading(true);
    try {
      const newStatus = item.status === 'active' ? 'inactive' : 'active';
      await dispatch(updateExample({ 
        id: item.id, 
        updates: { status: newStatus } 
      })).unwrap();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setLoading(false);
    }
  }, [dispatch, item.id, item.status]);
  
  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'default';
  };
  
  return (
    <Card sx={{ mb: 2, '&:hover': { boxShadow: 3 } }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" component="h2">
            {item.name}
          </Typography>
          <Chip 
            label={item.status} 
            color={getStatusColor(item.status)}
            size="small"
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" mb={2}>
          Created: {new Date(item.createdAt).toLocaleDateString('tr-TR')}
        </Typography>
        
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => onEdit(item)}
          >
            Düzenle
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            onClick={handleStatusToggle}
            disabled={loading}
          >
            {loading ? 'Güncelleniyor...' : 'Durum Değiştir'}
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => onDelete(item)}
          >
            Sil
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
});

ExampleCard.displayName = 'ExampleCard';

export default ExampleCard;
```

### 9. Mobile Component Patterns

**Mobile-Optimized Component:**
```jsx
// components/mobile/ExampleCardMobile.jsx
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const ExampleCardMobile = ({ item, onEdit, onDelete }) => {
  return (
    <Card 
      sx={{ 
        mb: 1,
        boxShadow: 1,
        '&:active': { transform: 'scale(0.98)' } // Touch feedback
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontSize: '1rem',
                fontWeight: 600,
                mb: 0.5
              }}
            >
              {item.name}
            </Typography>
            
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: '0.875rem' }}
            >
              {new Date(item.createdAt).toLocaleDateString('tr-TR')}
            </Typography>
            
            <Chip 
              label={item.status}
              size="small"
              sx={{ mt: 1, fontSize: '0.75rem' }}
              color={item.status === 'active' ? 'success' : 'default'}
            />
          </Box>
          
          <Box display="flex" flexDirection="column" gap={0.5}>
            <IconButton
              size="small"
              onClick={() => onEdit(item)}
              sx={{ 
                minWidth: 44, 
                minHeight: 44,
                bgcolor: 'primary.light',
                '&:hover': { bgcolor: 'primary.main' }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            
            <IconButton
              size="small"
              onClick={() => onDelete(item)}
              sx={{ 
                minWidth: 44, 
                minHeight: 44,
                bgcolor: 'error.light',
                '&:hover': { bgcolor: 'error.main' }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ExampleCardMobile;
```

### 10. Custom Hook Patterns

**Data Fetching Hook:**
```javascript
// hooks/useExample.js
import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExamples, selectExamples } from '../store/slices/exampleSlice';

export const useExample = (filters = {}) => {
  const dispatch = useDispatch();
  const { entities, loading, error } = useSelector(selectExamples);
  const [localFilters, setLocalFilters] = useState(filters);
  
  const refresh = useCallback(() => {
    dispatch(fetchExamples(localFilters));
  }, [dispatch, localFilters]);
  
  useEffect(() => {
    refresh();
  }, [refresh]);
  
  const updateFilters = useCallback((newFilters) => {
    setLocalFilters(prev => ({ ...prev, ...newFilters }));
  }, []);
  
  return {
    data: Object.values(entities),
    loading,
    error,
    filters: localFilters,
    updateFilters,
    refresh
  };
};
```

**Device Detection Hook:**
```javascript
// hooks/useDeviceDetect.js
import { useState, useEffect } from 'react';

export const useDeviceDetect = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true
  });
  
  useEffect(() => {
    const updateDevice = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent;
      
      // Check for user override
      const override = localStorage.getItem('deviceOverride');
      if (override) {
        setDeviceInfo({
          isMobile: override === 'mobile',
          isTablet: false,
          isDesktop: override === 'desktop'
        });
        return;
      }
      
      // Check URL for mobile route
      const isUrlMobile = window.location.pathname.startsWith('/mobile');
      if (isUrlMobile) {
        setDeviceInfo({
          isMobile: true,
          isTablet: false,
          isDesktop: false
        });
        return;
      }
      
      // Screen size based detection
      const isMobile = width <= 768;
      const isTablet = width > 768 && width <= 1024;
      
      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop: !isMobile && !isTablet
      });
    };
    
    updateDevice();
    window.addEventListener('resize', updateDevice);
    
    return () => window.removeEventListener('resize', updateDevice);
  }, []);
  
  return deviceInfo;
};
```

### 11. Redux Toolkit Patterns

**Slice Definition:**
```javascript
// store/slices/exampleSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { exampleAPI } from '../../services/api';

// Async thunks
export const fetchExamples = createAsyncThunk(
  'examples/fetchExamples',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await exampleAPI.getAll(filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.error);
    }
  }
);

export const createExample = createAsyncThunk(
  'examples/createExample',
  async (data, { rejectWithValue }) => {
    try {
      const response = await exampleAPI.create(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.error);
    }
  }
);

// Slice
const exampleSlice = createSlice({
  name: 'examples',
  initialState: {
    entities: {},
    ids: [],
    loading: false,
    error: null,
    filters: {},
    pagination: {
      page: 1,
      limit: 20,
      total: 0
    }
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    updateEntity: (state, action) => {
      const { id, updates } = action.payload;
      if (state.entities[id]) {
        state.entities[id] = { ...state.entities[id], ...updates };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch examples
      .addCase(fetchExamples.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExamples.fulfilled, (state, action) => {
        state.loading = false;
        const { data, pagination } = action.payload;
        
        // Normalize data
        state.entities = {};
        state.ids = [];
        data.forEach(item => {
          state.entities[item.id] = item;
          state.ids.push(item.id);
        });
        
        state.pagination = pagination;
      })
      .addCase(fetchExamples.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create example
      .addCase(createExample.fulfilled, (state, action) => {
        const newItem = action.payload.data;
        state.entities[newItem.id] = newItem;
        state.ids.unshift(newItem.id);
      });
  }
});

// Selectors
export const selectExamples = (state) => state.examples;
export const selectExampleById = (state, id) => state.examples.entities[id];
export const selectExamplesList = (state) => 
  state.examples.ids.map(id => state.examples.entities[id]);

export const { setFilters, clearError, updateEntity } = exampleSlice.actions;
export default exampleSlice.reducer;
```

## Testing Patterns

### 12. Unit Testing Guidelines

**Component Testing:**
```javascript
// __tests__/ExampleCard.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ExampleCard from '../components/Example/ExampleCard';
import exampleSlice from '../store/slices/exampleSlice';

const mockStore = configureStore({
  reducer: {
    examples: exampleSlice
  }
});

const mockItem = {
  id: 1,
  name: 'Test Item',
  status: 'active',
  createdAt: '2024-01-01T00:00:00Z'
};

describe('ExampleCard', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  
  beforeEach(() => {
    mockOnEdit.mockClear();
    mockOnDelete.mockClear();
  });
  
  it('renders item information correctly', () => {
    render(
      <Provider store={mockStore}>
        <ExampleCard 
          item={mockItem}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      </Provider>
    );
    
    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });
  
  it('calls onEdit when edit button is clicked', () => {
    render(
      <Provider store={mockStore}>
        <ExampleCard 
          item={mockItem}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      </Provider>
    );
    
    fireEvent.click(screen.getByText('Düzenle'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockItem);
  });
});
```

**API Testing:**
```javascript
// __tests__/api/exampleAPI.test.js
import axios from 'axios';
import { exampleAPI } from '../../services/api';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Example API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('fetches examples successfully', async () => {
    const mockData = [{ id: 1, name: 'Test' }];
    mockedAxios.get.mockResolvedValue({ data: mockData });
    
    const result = await exampleAPI.getAll();
    
    expect(mockedAxios.get).toHaveBeenCalledWith('/examples');
    expect(result.data).toEqual(mockData);
  });
  
  it('handles API errors', async () => {
    const errorMessage = 'Network Error';
    mockedAxios.get.mockRejectedValue(new Error(errorMessage));
    
    await expect(exampleAPI.getAll()).rejects.toThrow(errorMessage);
  });
});
```

## Performance Optimization Patterns

### 13. Frontend Optimization

**Component Memoization:**
```javascript
// Memo with custom comparison
const ExpensiveComponent = React.memo(({ item, settings }) => {
  // Expensive rendering logic
  return <div>{/* Complex UI */}</div>;
}, (prevProps, nextProps) => {
  // Custom comparison logic
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.updatedAt === nextProps.item.updatedAt &&
    JSON.stringify(prevProps.settings) === JSON.stringify(nextProps.settings)
  );
});

// useMemo for expensive calculations
const ProcessedData = ({ rawData }) => {
  const processedData = useMemo(() => {
    return rawData
      .filter(item => item.active)
      .map(item => ({
        ...item,
        calculatedValue: expensiveCalculation(item)
      }))
      .sort((a, b) => a.priority - b.priority);
  }, [rawData]);
  
  return <DataTable data={processedData} />;
};
```

**Debounced Search:**
```javascript
// hooks/useDebounce.js
import { useState, useEffect } from 'react';

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// Usage in component
const SearchComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  useEffect(() => {
    if (debouncedSearchTerm) {
      // Perform search
      searchAPI(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);
  
  return (
    <TextField
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
};
```

### 14. Backend Optimization

**Database Query Optimization:**
```javascript
// Optimized queries with proper includes and indexes
const getWorkOrdersOptimized = async (filters) => {
  const { page = 1, limit = 20, status, tezgahId } = filters;
  
  const where = {};
  if (status) where.durum = status;
  if (tezgahId) where.tezgah_id = tezgahId;
  
  return await IsEmri.findAndCountAll({
    where,
    include: [
      {
        model: Tezgah,
        as: 'tezgah',
        attributes: ['tezgah_id', 'tezgah_tanimi'] // Only needed fields
      },
      {
        model: Parca,
        as: 'parca',
        attributes: ['parca_kodu', 'parca_adi']
      }
    ],
    attributes: { 
      exclude: ['hareketler'] // Exclude large JSON fields if not needed
    },
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
    order: [
      ['oncelik', 'DESC'],
      ['teslim_tarihi', 'ASC']
    ]
  });
};
```

**Caching Patterns:**
```javascript
// Simple memory cache for frequently accessed data
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map();
  }
  
  set(key, value, ttlMs = 300000) { // 5 minutes default
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + ttlMs);
  }
  
  get(key) {
    if (!this.cache.has(key)) return null;
    
    if (Date.now() > this.ttl.get(key)) {
      this.cache.delete(key);
      this.ttl.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }
  
  invalidate(pattern) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        this.ttl.delete(key);
      }
    }
  }
}

const cache = new CacheManager();

// Usage in controller
const getCachedData = async (req, res) => {
  const cacheKey = `data_${JSON.stringify(req.query)}`;
  
  let data = cache.get(cacheKey);
  if (!data) {
    data = await fetchDataFromDatabase(req.query);
    cache.set(cacheKey, data);
  }
  
  res.json({ success: true, data });
};
```

## Security Patterns

### 15. Input Validation and Sanitization

```javascript
// Comprehensive validation schema
const workOrderValidation = {
  create: [
    body('is_emri_no')
      .trim()
      .notEmpty()
      .withMessage('İş emri numarası gerekli')
      .isLength({ max: 50 })
      .withMessage('İş emri numarası 50 karakterden fazla olamaz')
      .matches(/^[A-Z0-9-_]+$/)
      .withMessage('İş emri numarası sadece büyük harf, rakam, tire ve alt çizgi içerebilir'),
    
    body('adet')
      .isInt({ min: 1, max: 999999 })
      .withMessage('Adet 1-999999 arasında olmalı'),
    
    body('teslim_tarihi')
      .isISO8601()
      .withMessage('Geçerli bir tarih giriniz')
      .custom(value => {
        if (new Date(value) < new Date()) {
          throw new Error('Teslim tarihi geçmiş bir tarih olamaz');
        }
        return true;
      }),
    
    body('oncelik')
      .isIn(['dusuk', 'normal', 'yuksek', 'acil'])
      .withMessage('Geçersiz öncelik değeri')
  ]
};
```

### 16. File Upload Security

```javascript
// Secure file upload with validation
const secureFileUpload = (allowedTypes, maxSize = 10 * 1024 * 1024) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '../uploads', file.fieldname);
      
      // Ensure directory exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Sanitize filename
      const sanitized = file.originalname
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .substring(0, 100); // Limit length
      
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const ext = path.extname(sanitized);
      const name = path.basename(sanitized, ext);
      
      cb(null, `${name}_${timestamp}_${random}${ext}`);
    }
  });
  
  return multer({
    storage,
    limits: { fileSize: maxSize },
    fileFilter: (req, file, cb) => {
      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`));
      }
      
      // Additional security checks
      const ext = path.extname(file.originalname).toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'];
      
      if (!allowedExtensions.includes(ext)) {
        return cb(new Error('File extension not allowed'));
      }
      
      cb(null, true);
    }
  });
};
```

## Code Style and Conventions

### 17. Naming Conventions

**Backend (Node.js):**
- **Files**: camelCase (`userController.js`, `workOrderModel.js`)
- **Functions**: camelCase (`getUserById`, `createWorkOrder`)
- **Variables**: camelCase (`workOrderData`, `currentUser`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `DEFAULT_PAGE_SIZE`)
- **Database**: snake_case (`is_emri_id`, `tezgah_durum`)

**Frontend (React):**
- **Components**: PascalCase (`WorkOrderCard`, `MobileLayout`)
- **Files**: PascalCase for components (`WorkOrderCard.jsx`)
- **Hooks**: camelCase starting with 'use' (`useWorkOrders`, `useDeviceDetect`)
- **Props**: camelCase (`isLoading`, `onItemClick`)
- **State**: camelCase (`currentItem`, `selectedItems`)

### 18. Documentation Standards

**Function Documentation:**
```javascript
/**
 * Creates a new work order with validation and audit logging
 * 
 * @param {Object} workOrderData - Work order information
 * @param {string} workOrderData.is_emri_no - Unique work order number
 * @param {number} workOrderData.adet - Quantity to produce
 * @param {string} workOrderData.parca_kodu - Part code reference
 * @param {number} workOrderData.tezgah_id - Assigned workstation ID
 * @param {Object} user - Current user for audit logging
 * @returns {Promise<Object>} Created work order with ID
 * @throws {ValidationError} When required fields are missing
 * @throws {DatabaseError} When database operation fails
 * 
 * @example
 * const workOrder = await createWorkOrder({
 *   is_emri_no: 'WO-2024-001',
 *   adet: 100,
 *   parca_kodu: 'PART-001',
 *   tezgah_id: 1
 * }, currentUser);
 */
async function createWorkOrder(workOrderData, user) {
  // Implementation
}
```

**Component Documentation:**
```jsx
/**
 * Work Order Card component for displaying work order information
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.workOrder - Work order data object
 * @param {string} props.workOrder.is_emri_no - Work order number
 * @param {string} props.workOrder.is_adi - Work order name
 * @param {number} props.workOrder.adet - Quantity
 * @param {string} props.workOrder.durum - Current status
 * @param {Function} props.onEdit - Callback when edit button clicked
 * @param {Function} props.onDelete - Callback when delete button clicked
 * @param {boolean} [props.compact=false] - Whether to show compact version
 * 
 * @example
 * <WorkOrderCard
 *   workOrder={workOrderData}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   compact={false}
 * />
 */
const WorkOrderCard = ({ workOrder, onEdit, onDelete, compact = false }) => {
  // Component implementation
};
```

## Deployment and Production Patterns

### 19. Environment Configuration

```javascript
// config/environment.js
const config = {
  development: {
    port: process.env.PORT || 3001,
    database: {
      storage: './database.sqlite',
      logging: console.log
    },
    cors: {
      origin: 'http://localhost:3000',
      credentials: true
    },
    logging: {
      level: 'debug',
      file: 'logs/development.log'
    }
  },
  
  production: {
    port: process.env.PORT || 3001,
    database: {
      storage: process.env.DB_PATH || './database.sqlite',
      logging: false
    },
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true
    },
    logging: {
      level: 'error',
      file: 'logs/production.log'
    }
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];
```

### 20. Error Logging and Monitoring

```javascript
// utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

This comprehensive development guide provides the foundation for maintaining consistency, quality, and scalability across the ÜRTM Takip manufacturing tracking system while following modern development best practices.