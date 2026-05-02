---
name: CONVENTIONS.md
description: Coding style, naming conventions, error handling patterns
type: codebase
---

# Coding Conventions

## File Naming

### Backend
- Routes: `moduleRoutes.js` → kebab-case
- Controllers: `moduleController.js` → kebab-case  
- Models: `moduleModel.js` → kebab-case

### Frontend
- Components: `ComponentName.jsx` → PascalCase
- Hooks: `useHookName.js` → camelCase
- Utils: `utilityName.js` → camelCase

### Database
- Tables: `table_name` → snake_case
- Columns: `column_name` → snake_case

## API Endpoints

### RESTful Patterns
```javascript
// List
router.get('/', controller.list);

// Get single
router.get('/:id', controller.get);

// Create
router.post('/', validation, controller.create);

// Update
router.put('/:id', validation, controller.update);

// Delete
router.delete('/:id', controller.delete);
```

### Endpoint naming
- kebab-case: `/api/is-emirleri`, `/api/tezgahlar`

## Code Style

### JavaScript
- ES6+ syntax
- Async/await for promises
- Template literals for strings

### Example (Backend Controller)
```javascript
exports.list = async (req, res) => {
  try {
    const data = await Model.findAll();
    res.json(data);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
};
```

### Example (React Component)
```jsx
const ComponentName = () => {
  const [state, setState] = useState();
  
  useEffect(() => {}, []);
  
  const handleClick = () => {};
  
  return (<JSX />);
};
```

## Error Handling

### Backend
- Try/catch blocks
- Winston logger
- HTTP status codes (200, 400, 404, 500)

### Frontend
- Error boundaries
- User-friendly messages
- Console logging in development

## Comments

Minimal comments - code should be self-documenting:
- Use descriptive names
- Complex logic: brief inline comment