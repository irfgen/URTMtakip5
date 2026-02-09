const jwt = require('jsonwebtoken');
const Personel = require('../../models/Personel');
const Irsaliye = require('../../models/Irsaliye');
const Fatura = require('../../models/Fatura');

/**
 * Socket.IO Namespace for Fatura & İrsaliye Eşleştirme
 *
 * Features:
 * - Authentication middleware
 * - Heartbeat for crash detection
 * - Graceful disconnect handling
 * - Message queuing for delivery guarantee
 */
const faturaNamespace = (io) => {
    const namespace = io.of('/fatura-eslestirme');

    // Message queue for delivery guarantee
    const messageQueue = new Map(); // userId -> Array of undelivered messages

    // Authentication middleware (disabled for development)
    namespace.use(async (socket, next) => {
        try {
            // Development mode: skip authentication, use default user
            // TODO: Enable authentication in production
            /*
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            const user = await Personel.findByPk(decoded.id);

            if (!user) {
                return next(new Error('User not found'));
            }

            socket.data.user = user;
            socket.data.userId = user.id;
            */

            // Development mode: use default user
            socket.data.userId = socket.handshake.auth.userId || 1;
            socket.data.lastHeartbeat = Date.now();

            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    namespace.on('connection', (socket) => {
        const userId = socket.data.userId;

        console.log(`User ${userId} connected to fatura-eslestirme namespace`);

        // Join user's personal room for direct messages
        socket.join(`user-${userId}`);

        // Send queued messages
        if (messageQueue.has(userId)) {
            const queuedMessages = messageQueue.get(userId);
            queuedMessages.forEach(msg => {
                socket.emit(msg.event, msg.data);
            });
            messageQueue.delete(userId);
        }

        // Heartbeat handler
        socket.on('heartbeat', async () => {
            socket.data.lastHeartbeat = Date.now();

            // TODO: Update user activity in database if needed
            // await UserActivity.update(...)

            socket.emit('heartbeat-ack', { timestamp: Date.now() });
        });

        // Subscribe to fatura updates
        socket.on('subscribe-fatura', (faturaId) => {
            socket.join(`fatura-${faturaId}`);
            socket.emit('subscribed', { faturaId });
        });

        // Unsubscribe from fatura updates
        socket.on('unsubscribe-fatura', (faturaId) => {
            socket.leave(`fatura-${faturaId}`);
            socket.emit('unsubscribed', { faturaId });
        });

        // Subscribe to irsaliye updates
        socket.on('subscribe-irsaliye', (irsaliyeId) => {
            socket.join(`irsaliye-${irsaliyeId}`);
            socket.emit('subscribed', { irsaliyeId });
        });

        // Unsubscribe from irsaliye updates
        socket.on('unsubscribe-irsaliye', (irsaliyeId) => {
            socket.leave(`irsaliye-${irsaliyeId}`);
            socket.emit('unsubscribed', { irsaliyeId });
        });

        // Graceful disconnect handling
        socket.on('disconnect', async () => {
            console.log(`User ${userId} disconnected from fatura-eslestirme`);

            // Don't auto-release locks immediately - give time for reconnection
            // Background job will handle expired locks
        });

        // Error handling
        socket.on('error', (error) => {
            console.error(`Socket error for user ${userId}:`, error);
        });
    });

    // Helper function to emit with queuing
    namespace.emitWithQueue = (userId, event, data) => {
        const room = namespace.adapter.rooms.get(`user-${userId}`);

        if (room && room.size > 0) {
            // User is online, send directly
            namespace.to(`user-${userId}`).emit(event, data);
        } else {
            // User is offline, queue message
            if (!messageQueue.has(userId)) {
                messageQueue.set(userId, []);
            }
            messageQueue.get(userId).push({ event, data });

            // Limit queue size
            const queue = messageQueue.get(userId);
            if (queue.length > 100) {
                queue.shift(); // Remove oldest message
            }
        }
    };

    return namespace;
};

module.exports = faturaNamespace;
