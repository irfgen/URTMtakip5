// This script helps to dynamically discover the backend port
// It will try to connect to the backend using various methods

import getApiBaseUrl from './getApiBaseUrl';

async function discoverBackendPort() {
  const startPort = 3000;
  const maxAttempts = 10;

  // Try to detect if we're in development mode with Vite proxy
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  if (origin.includes(':5173')) {
    console.log('Development mode detected: Using Vite proxy');
    return 3000; // Proxy will handle the forwarding
  }

  // Try different host configurations for port discovery
  const hosts = ['localhost', '127.0.0.1', window.location.hostname];

  for (const host of hosts) {
    for (let port = startPort; port < startPort + maxAttempts; port++) {
      try {
        const response = await fetch(`http://${host}:${port}/port-info`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(500) // Timeout after 500ms
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`Backend discovered on ${host}:${data.port}`);
          return data.port;
        }
      } catch (error) {
        // Failed to connect on this port, try the next one
        console.log(`Backend not found on ${host}:${port}, trying next...`);
      }
    }
  }

  // Default to 3000 if no server found
  console.log('Could not discover backend port, using default: 3000');
  return 3000;
}

// Function to test backend connectivity
async function testBackendConnection() {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/port-info`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(2000)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Backend connection successful:', data);
      return true;
    }
  } catch (error) {
    console.error('Backend connection failed:', error);
    return false;
  }
}

export default discoverBackendPort;
export { testBackendConnection };
