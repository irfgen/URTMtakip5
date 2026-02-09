/**
 * Authentication Middleware
 *
 * Bu middleware JWT token doğrulaması yapar ve req.user nesnesini doldurur.
 * Ayrıca req.io nesnesini Socket.IO erişimi için ekler.
 */

const jwt = require('jsonwebtoken');
const Personel = require('../models/Personel');

// Varsayılan JWT secret - production'da environment variable kullanılmalı
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authMiddleware = async (req, res, next) => {
    try {
        // Token'ı various locations'dan al
        let token = null;

        // 1. Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }

        // 2. Query parameter
        if (!token && req.query.token) {
            token = req.query.token;
        }

        // 3. Custom header
        if (!token && req.headers['x-access-token']) {
            token = req.headers['x-access-token'];
        }

        // Token yoksa - development modunda test için dummy user oluştur
        if (!token && process.env.NODE_ENV !== 'production') {
            req.user = {
                id: 1,
                ad_soyad: 'Test User',
                email: 'test@example.com',
                role: ['admin']
            };
            return next();
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token gerekli'
            });
        }

        // Token'ı doğrula
        const decoded = jwt.verify(token, JWT_SECRET);

        // Kullanıcı bilgisini veritabanından al
        const personel = await Personel.findByPk(decoded.id);

        if (!personel) {
            return res.status(401).json({
                success: false,
                error: 'Kullanıcı bulunamadı'
            });
        }

        // Kullanıcı bilgisini req'e ekle
        req.user = {
            id: personel.id,
            ad_soyad: personel.ad_soyad || personel.username,
            email: personel.email,
            role: personel.role ? personel.role.split(',') : ['user']
        };

        // Socket.IO erişimi için req.io'yu ekle
        // index.js'te app.set('io', io) yapılmış
        const expressApp = req.app;
        if (expressApp && expressApp.get) {
            req.io = expressApp.get('io');
        }

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Geçersiz token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token süresi doldu'
            });
        }

        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication hatası'
        });
    }
};

module.exports = authMiddleware;
