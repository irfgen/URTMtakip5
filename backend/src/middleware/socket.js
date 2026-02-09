/**
 * Socket.IO Middleware
 *
 * Injects the Socket.IO io instance into req.io for use in routes
 * This allows routes to emit Socket.IO events without importing io directly
 */

let ioInstance = null;

/**
 * Initialize the middleware with the Socket.IO io instance
 * @param {object} io - Socket.IO io instance
 */
function initialize(io) {
    ioInstance = io;
}

/**
 * Middleware function to inject io into req.io
 */
function socketMiddleware(req, res, next) {
    req.io = ioInstance;
    next();
}

module.exports = {
    initialize,
    middleware: socketMiddleware
};
