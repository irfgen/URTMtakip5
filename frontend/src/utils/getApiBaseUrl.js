export default function getApiBaseUrl() {
  const fromEnv = import.meta.env?.VITE_API_URL;
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim()) {
    const val = fromEnv.trim();
    // Placeholder içeriyorsa görmezden gel
    const looksLikePlaceholder =
      /SUNUCU_IP/i.test(val) || val.includes('<') || val.includes('>') || val === 'http://192.168.1.206:3000/api';
    if (!looksLikePlaceholder) {
      return val; // Örn: http://10.0.0.12:3000/api
    }
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // Vite dev ortamı (5173) -> proxy kullanalım
  if (origin.includes(':5173')) {
    console.log('Development mode detected: Using Vite proxy');
    return '/api';
  }

  // Check if we're in a different development port
  if (origin.includes(':3001') || origin.includes(':8080') || origin.includes(':4200')) {
    console.log(`Alternative development port detected: ${origin}`);
    return `http://localhost:3000/api`;
  }

  // Production or custom port: use origin + /api
  if (origin && !origin.includes('file://')) {
    const baseUrl = `${origin.replace(/\/$/, '')}/api`;
    console.log(`Using origin-based API URL: ${baseUrl}`);
    return baseUrl;
  }

  // Fallback for file:// protocol or other edge cases
  console.log('Using fallback API URL: http://localhost:3000/api');
  return 'http://localhost:3000/api';
}

// Helper function to get WebSocket URL
export function getWebSocketUrl() {
  const fromEnv = import.meta.env?.VITE_WS_URL;
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim()) {
    const val = fromEnv.trim();
    const looksLikePlaceholder = /SUNUCU_IP/i.test(val) || val.includes('<') || val.includes('>');
    if (!looksLikePlaceholder) {
      return val;
    }
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // Development mode with proxy - use relative path for network access
  if (origin.includes(':5173')) {
    // Use relative WebSocket path - browser will auto-resolve to current host
    console.log('Development mode detected: Using relative WebSocket path');
    return '';
  }

  // Production or custom port - convert origin to WebSocket URL
  if (origin && !origin.includes('file://')) {
    const wsUrl = origin.replace(/^http/, 'ws').replace(/\/$/, '');
    console.log(`Using WebSocket URL from origin: ${wsUrl}`);
    return wsUrl;
  }

  // Fallback - use localhost (will only work on local machine)
  console.log('Using fallback WebSocket URL: ws://localhost:3000');
  return 'ws://localhost:3000';
}

// Helper function to get file upload URL
export function getFileUploadUrl() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  // Development mode with proxy
  if (origin.includes(':5173')) {
    return '/uploads';
  }

  // Production or custom port
  if (origin && !origin.includes('file://')) {
    return `${origin.replace(/\/$/, '')}/uploads`;
  }

  // Fallback
  return 'http://localhost:3000/uploads';
}