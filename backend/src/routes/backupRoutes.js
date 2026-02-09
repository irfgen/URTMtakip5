const express = require('express');
const router = express.Router();
const { 
  createBackup, 
  listBackups, 
  restoreBackup, 
  deleteBackup 
} = require('../controllers/backupController');

router.post('/create', createBackup);
router.get('/list', listBackups);
router.post('/restore/:fileName', restoreBackup);
router.delete('/delete/:fileName', deleteBackup);

module.exports = router;