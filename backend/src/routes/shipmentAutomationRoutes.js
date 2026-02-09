const express = require('express');
const router = express.Router();
const shipmentAutomationService = require('../services/shipmentAutomationService');

/**
 * Otomatik sevkiyat servisi durumunu getir
 */
router.get('/status', (req, res) => {
  try {
    const status = shipmentAutomationService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Otomatik sevkiyat servisini manuel başlat
 */
router.post('/start', async (req, res) => {
  try {
    await shipmentAutomationService.start();
    res.json({
      success: true,
      message: 'Otomatik sevkiyat servisi başlatıldı'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Otomatik sevkiyat servisini manuel durdur
 */
router.post('/stop', async (req, res) => {
  try {
    await shipmentAutomationService.stop();
    res.json({
      success: true,
      message: 'Otomatik sevkiyat servisi durduruldu'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Manuel kontrol tetikle
 */
router.post('/check', async (req, res) => {
  try {
    await shipmentAutomationService.checkPendingTales();
    res.json({
      success: true,
      message: 'Bekleyen tedarik talepleri kontrol edildi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;