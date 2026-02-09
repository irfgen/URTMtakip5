import { io } from 'socket.io-client';

/**
 * Socket.IO Client Service
 *
 * URTM Takip sistemi için gerçek zamanlı iletişim servisi.
 * Uygunsuzluk modülü ve diğer modüller için bildirimleri yönetir.
 */

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  /**
   * Socket.IO bağlantısını başlat
   */
  connect() {
    if (this.socket?.connected) {
      console.log('Socket.IO zaten bağlı');
      return this.socket;
    }

    // Development modunda proxy üzerinden bağlan, production'da doğrudan backend'e
    const socketUrl = import.meta.env.DEV
      ? window.location.origin  // Proxy kullan (localhost:5173)
      : (import.meta.env.VITE_SOCKET_URL || 'http://127.0.0.1:3000');

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 10000
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO bağlantısı kuruldu:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO bağlantısı kesildi:', reason);
    });

    this.socket.on('connect_error', (error) => {
      // Sadece development modunda ve son deneme başarısız olduğunda göster
      if (import.meta.env.DEV && this.socket?.io?._reconnectionAttempts) {
        console.warn('Socket.IO backend aranıyor...');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket.IO yeniden bağlandı, deneme:', attemptNumber);
    });

    return this.socket;
  }

  /**
   * Socket.IO bağlantısını kes
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log('Socket.IO bağlantısı kapatıldı');
    }
  }

  /**
   * Event dinleyicisi ekle
   */
  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket.IO bağlı değil, öncelikle connect() çağrın');
      return;
    }

    this.socket.on(event, callback);

    // Listener'ı takip et
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Event dinleyicisini kaldır
   */
  off(event, callback) {
    if (!this.socket) return;

    this.socket.off(event, callback);

    if (callback && this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else if (this.listeners.has(event)) {
      this.listeners.delete(event);
    }
  }

  /**
   * Event gönder
   */
  emit(event, data) {
    if (!this.socket) {
      console.warn('Socket.IO bağlı değil, öncelikle connect() çağrın');
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Bağlantı durumu
   */
  get connected() {
    return this.socket?.connected || false;
  }

  /**
   * Socket.IO instance'ı döndür
   */
  get instance() {
    return this.socket;
  }
}

// Singleton export
export const socketService = new SocketService();

// Auto-connect on import (development ortamında)
if (import.meta.env.DEV) {
  socketService.connect();
}

export default socketService;
