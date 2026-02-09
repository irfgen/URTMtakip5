import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Dynamically determine the target port based on available backends
function getBackendTarget() {
  // Try multiple possible backend addresses - localhost first for local development
  const possibleTargets = [
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://0.0.0.0:3000',
    'http://192.168.1.206:3000'
  ];

  return possibleTargets[0]; // Primary target
}

// Function to test if backend is available
function isBackendAvailable(target) {
  try {
    const net = require('net');
    const client = new net.Socket();

    return new Promise((resolve) => {
      const url = new URL(target);
      client.setTimeout(2000);

      client.connect(url.port || 3000, url.hostname, () => {
        client.destroy();
        resolve(true);
      });

      client.on('error', () => {
        client.destroy();
        resolve(false);
      });

      client.on('timeout', () => {
        client.destroy();
        resolve(false);
      });
    });
  } catch (error) {
    return Promise.resolve(false);
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: getBackendTarget(),
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy, _options) => {
          const VERBOSE = process.env.VITE_HTTP_LOG === 'true';

          proxy.on('error', (err, req, res) => {
            if (err.code === 'ECONNREFUSED') {
              console.log('⚠️ Backend not available. Please ensure backend is running on port 3000');

              // Send a custom error response instead of just failing
              if (res && !res.headersSent) {
                res.writeHead(503, {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({
                  error: 'Backend Unavailable',
                  message: 'Backend server is not running. Please start the backend server.',
                  code: 'BACKEND_UNAVAILABLE'
                }));
              }
              return;
            }

            if (VERBOSE) console.log('🔴 Proxy error:', err.message);
          });

          proxy.on('proxyReq', (proxyReq, req, _res) => {
            if (VERBOSE) console.log('🔵 API Request:', req.method, req.url);

            // Add custom headers to help identify proxied requests
            proxyReq.setHeader('X-Forwarded-For', req.socket.remoteAddress);
            proxyReq.setHeader('X-Proxy-Request', 'true');
          });

          proxy.on('proxyRes', (proxyRes, req, _res) => {
            if (VERBOSE) console.log('🟢 API Response:', proxyRes.statusCode, req.url);

            // Add CORS headers for development
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
          });
        },
      },

      // Socket.IO WebSocket proxy with enhanced configuration
      '/socket.io': {
        target: getBackendTarget(),
        changeOrigin: true,
        ws: true,
        configure: (proxy, _options) => {
          const VERBOSE = process.env.VITE_HTTP_LOG === 'true';

          proxy.on('error', (err, _req, _res) => {
            if (err.code === 'ECONNREFUSED') {
              console.log('⚠️ WebSocket backend not available for Socket.IO');
            } else if (VERBOSE) {
              console.log('🔴 WebSocket Proxy error:', err.message);
            }
          });

          if (VERBOSE) {
            proxy.on('proxyReqWs', (proxyReq, req, _socket, _options, head) => {
              console.log('🔵 WebSocket upgrade request:', req.url);
            });

            proxy.on('open', (proxySocket) => {
              console.log('🟢 WebSocket connection opened');
            });

            proxy.on('close', (proxySocket, _closedProxySocket, event) => {
              console.log('🔴 WebSocket connection closed:', event.code, event.reason);
            });
          }
        },
      },

      // Static file serving for uploads
      '/uploads': {
        target: getBackendTarget(),
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          const VERBOSE = process.env.VITE_HTTP_LOG === 'true';

          proxy.on('error', (err, req, res) => {
            if (err.code === 'ECONNREFUSED') {
              console.log('⚠️ Upload service not available');

              if (res && !res.headersSent) {
                res.writeHead(503, { 'Content-Type': 'text/plain' });
                res.end('Upload service unavailable');
              }
            } else if (VERBOSE) {
              console.log('🔴 Upload proxy error:', err.message);
            }
          });

          if (VERBOSE) {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('📁 File Request:', req.method, req.url);
            });
          }
        },
      },

      // Importlar directory for Excel file processing
      '/importlar': {
        target: getBackendTarget(),
        changeOrigin: true,
        secure: false,
      },

      // Backend health check endpoint
      '/port-info': {
        target: getBackendTarget(),
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          const VERBOSE = process.env.VITE_HTTP_LOG === 'true';

          proxy.on('error', (err, req, res) => {
            if (err.code === 'ECONNREFUSED') {
              console.log('⚠️ Backend health check not available');

              if (res && !res.headersSent) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  status: 'unavailable',
                  message: 'Backend server is not running'
                }));
              }
            } else if (VERBOSE) {
              console.log('🔴 Health check proxy error:', err.message);
            }
          });

          if (VERBOSE) {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('🏥 Health Check Request:', req.method, req.url);
            });
          }
        },
      },
    },
    // Add custom middleware to handle requests when backend is down
    middleware: (mode) => {
      return (req, res, next) => {
        // Custom error handling for API routes when backend is unavailable
        if (req.url.startsWith('/api/') && !req.headers.upgrade) {
          // This will be called only if proxy fails
          res.on('finish', () => {
            // Check if response was handled by proxy
            if (res.statusCode === 502 || res.statusCode === 503) {
              console.log(`🔴 Backend unavailable for: ${req.method} ${req.url}`);
            }
          });
        }
        next();
      };
    },
  },

  // Build configuration
  build: {
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          charts: ['chart.js', 'react-chartjs-2'],
        },
        sourcemapPathTransform: (relativeSourcePath) => {
          return relativeSourcePath.replace(/^\//, '');
        }
      },
    },
    // Generate source maps for debugging
    minify: 'esbuild',
  },

  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },

  // Environment variables prefix
  envPrefix: 'VITE',
});