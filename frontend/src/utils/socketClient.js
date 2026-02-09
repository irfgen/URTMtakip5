import { io } from 'socket.io-client';
import { getWebSocketUrl } from './getApiBaseUrl';

class SocketClient {
  constructor() {
    this.socket = null;
    this.isInitialized = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
  }

  async initialize() {
    if (this.isInitialized && this.socket?.connected) {
      return this.socket;
    }

    try {
      // Get WebSocket URL from environment or fallback
      const wsUrl = getWebSocketUrl();

      console.log(`Initializing WebSocket connection to: ${wsUrl}`);

      // Create socket connection with enhanced configuration
      this.socket = io(wsUrl, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        transports: ['websocket', 'polling'],
        forceNew: true,
      });

      this.setupEventHandlers();
      this.isInitialized = true;

      return this.socket;
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      throw error;
    }
  }

  setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('🟢 WebSocket connected successfully');
      this.reconnectAttempts = 0;
      this.emit('connection-status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`🔴 WebSocket disconnected: ${reason}`);
      this.emit('connection-status', { connected: false, reason });

      if (reason === 'io server disconnect') {
        // The disconnection was initiated by the server, reconnect manually
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 WebSocket connection error:', error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('🔴 Max reconnection attempts reached');
        this.emit('connection-status', {
          connected: false,
          error: 'Max reconnection attempts reached',
          canRetry: false
        });
      } else {
        console.log(`🔄 Retrying connection... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.emit('connection-status', {
          connected: false,
          error: error.message,
          canRetry: true,
          attempt: this.reconnectAttempts
        });
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🟢 WebSocket reconnected after ${attemptNumber} attempts`);
      this.emit('connection-status', { connected: true, reconnected: true });
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 WebSocket reconnection attempt ${attemptNumber}`);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('🔴 WebSocket reconnection failed');
      this.emit('connection-status', {
        connected: false,
        error: 'Reconnection failed',
        canRetry: false
      });
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('🔴 WebSocket error:', error);
      this.emit('socket-error', error);
    });
  }

  // Event management
  on(event, callback) {
    // Store custom listeners
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Also register with socket
    if (this.socket) {
      this.socket.on(event, callback);
    }

    return this;
  }

  off(event, callback) {
    // Remove from custom listeners
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }

    // Remove from socket
    if (this.socket) {
      this.socket.off(event, callback);
    }

    return this;
  }

  emit(event, data) {
    // Emit to custom listeners
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in custom event listener for ${event}:`, error);
        }
      });
    }

    // Also emit to socket if available
    if (this.socket) {
      this.socket.emit(event, data);
    }

    return this;
  }

  // Send message to server
  send(event, data) {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Cannot send message - WebSocket not connected');
      return false;
    }

    this.socket.emit(event, data);
    return true;
  }

  // Get connection status
  isConnected() {
    return this.socket?.connected || false;
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected(),
      initializing: this.isInitialized,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      socketId: this.socket?.id || null
    };
  }

  // Manual reconnect
  async reconnect() {
    if (this.socket) {
      this.reconnectAttempts = 0;
      this.socket.connect();
    } else {
      await this.initialize();
    }
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isInitialized = false;
    this.reconnectAttempts = 0;
    this.listeners.clear();
  }

  // Get socket instance (for direct access if needed)
  getSocket() {
    return this.socket;
  }
}

// Create singleton instance
const socketClient = new SocketClient();

export default socketClient;

// Export convenience functions for backward compatibility
export const connect = () => socketClient.initialize();
export const disconnect = () => socketClient.disconnect();
export const send = (event, data) => socketClient.send(event, data);
export const on = (event, callback) => socketClient.on(event, callback);
export const off = (event, callback) => socketClient.off(event, callback);
export const isConnected = () => socketClient.isConnected();
export const getConnectionStatus = () => socketClient.getConnectionStatus();