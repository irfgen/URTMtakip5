const express = require('express');
const router = express.Router();
const timelineController = require('../controllers/timelineController');

// Timeline ana verileri
router.get('/data', timelineController.getTimelineData);

// Vardiya tabanlı timeline
router.get('/shift-based', timelineController.getShiftBasedTimeline);

// Timeline görevini güncelle (drag & drop)
router.put('/task/:taskId', timelineController.updateTimelineTask);

// Görev sırasını güncelle
router.put('/order/:tezgahId', timelineController.updateTaskOrder);

// Timeline raporu
router.get('/report', timelineController.getTimelineReport);

// Timeline görevini sil
router.delete('/task/:taskId', timelineController.deleteTask);

// Timeline görevini kopyala
router.post('/task/:taskId/duplicate', timelineController.duplicateTask);

// İş emri durumunu güncelle
router.patch('/task/:taskId/status', timelineController.updateTaskStatus);

module.exports = router;