import { useEffect, useRef, useCallback } from 'react';
import socketClient from '../utils/socketClient';

/**
 * useFaturaIrsaliyeSocket - Fatura & İrsaliye eşleştirme Socket.IO hook
 *
 * Socket.IO namespace: /fatura-eslestirme
 *
 * Events:
 * - lock-acquired: Kilit alındı bildirimi
 * - lock-released: Kilit bırakıldı bildirimi
 * - lock-force-released: Kilit zorla bırakıldı (admin)
 * - eslestirme-tamamlandi: Eşleşme tamamlandı
 * - eslestirme-kaldirildi: Eşleşme kaldırıldı
 * - heartbeat-ack: Heartbeat acknowledgment
 *
 * @param {Object} options - Ayarlar
 * @param {Function} options.onLockAcquired - Kilit alındı callback
 * @param {Function} options.onLockReleased - Kilit bırakıldı callback
 * @param {Function} options.onEslestirmeTamamlandi - Eşleşme tamamlandı callback
 * @param {Function} options.onEslestirmeKaldirildi - Eşleşme kaldırıldı callback
 * @returns {Object} { socket, connected, subscribe, unsubscribe, sendHeartbeat }
 */
const useFaturaIrsaliyeSocket = (options = {}) => {
    const {
        onLockAcquired,
        onLockReleased,
        onLockForceReleased,
        onEslestirmeTamamlandi,
        onEslestirmeKaldirildi
    } = options;

    const socketRef = useRef(null);
    const connectedRef = useRef(false);
    const namespace = '/fatura-eslestirme';
    const heartbeatIntervalRef = useRef(null);

    /**
     * Socket.IO namespace'e bağlan
     */
    const connect = useCallback(async () => {
        try {
            const socket = await socketClient.initialize();

            // Namespace'e katıl
            socket.emit('join-namespace', { namespace });

            socketRef.current = socket;
            connectedRef.current = socket.connected;

            // Event listeners'ı kur
            setupEventListeners(socket);

            return socket;
        } catch (error) {
            console.error('Failed to connect to fatura-irsaliye namespace:', error);
        }
    }, []);

    /**
     * Event listeners'ı kur
     */
    const setupEventListeners = useCallback((socket) => {
        if (!socket) return;

        // Lock acquired
        socket.on('lock-acquired', (data) => {
            console.log('Lock acquired:', data);
            if (onLockAcquired) {
                onLockAcquired(data);
            }
        });

        // Lock released
        socket.on('lock-released', (data) => {
            console.log('Lock released:', data);
            if (onLockReleased) {
                onLockReleased(data);
            }
        });

        // Lock force released (admin)
        socket.on('lock-force-released', (data) => {
            console.log('Lock force released:', data);
            if (onLockForceReleased) {
                onLockForceReleased(data);
            }
        });

        // Eşleşme tamamlandı
        socket.on('eslestirme-tamamlandi', (data) => {
            console.log('Eşleşme tamamlandı:', data);
            if (onEslestirmeTamamlandi) {
                onEslestirmeTamamlandi(data);
            }
        });

        // Eşleşme kaldırıldı
        socket.on('eslestirme-kaldirildi', (data) => {
            console.log('Eşleşme kaldırıldı:', data);
            if (onEslestirmeKaldirildi) {
                onEslestirmeKaldirildi(data);
            }
        });

        // Heartbeat acknowledgment
        socket.on('heartbeat-ack', (data) => {
            console.log('Heartbeat acknowledged:', data);
        });
    }, [onLockAcquired, onLockReleased, onLockForceReleased, onEslestirmeTamamlandi, onEslestirmeKaldirildi]);

    /**
     * Fatura güncellemelerine abone ol
     */
    const subscribeFatura = useCallback((faturaId) => {
        const socket = socketRef.current;
        if (socket && socket.connected) {
            socket.emit('subscribe-fatura', faturaId);
            console.log(`Subscribed to fatura: ${faturaId}`);
        }
    }, []);

    /**
     * Fatura aboneliğinden ayrıl
     */
    const unsubscribeFatura = useCallback((faturaId) => {
        const socket = socketRef.current;
        if (socket && socket.connected) {
            socket.emit('unsubscribe-fatura', faturaId);
            console.log(`Unsubscribed from fatura: ${faturaId}`);
        }
    }, []);

    /**
     * Heartbeat gönder
     */
    const sendHeartbeat = useCallback(() => {
        const socket = socketRef.current;
        if (socket && socket.connected) {
            socket.emit('heartbeat');
        }
    }, []);

    /**
     * Heartbeat'i başlat
     */
    const startHeartbeat = useCallback((interval = 30000) => {
        stopHeartbeat();
        heartbeatIntervalRef.current = setInterval(sendHeartbeat, interval);
        console.log('Heartbeat started');
    }, [sendHeartbeat]);

    /**
     * Heartbeat'i durdur
     */
    const stopHeartbeat = useCallback(() => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
            console.log('Heartbeat stopped');
        }
    }, []);

    // Component mount'ta bağlan
    useEffect(() => {
        connect();

        // Cleanup
        return () => {
            stopHeartbeat();
        };
    }, [connect, stopHeartbeat]);

    return {
        socket: socketRef.current,
        connected: connectedRef.current,
        subscribeFatura,
        unsubscribeFatura,
        sendHeartbeat,
        startHeartbeat,
        stopHeartbeat
    };
};

export default useFaturaIrsaliyeSocket;
