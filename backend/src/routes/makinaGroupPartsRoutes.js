const express = require('express');
const router = express.Router();
const makinaGroupPartsController = require('../controllers/makinaGroupPartsController');

// Belirli bir makinanın tüm gruplarını ve parçalarını detaylarıyla getir
router.get('/makina/:makina_id/group-parts', makinaGroupPartsController.getMakinaGroupParts);

// Belirli bir grubun detaylarını getir
router.get('/group/:group_id/details', makinaGroupPartsController.getGroupDetails);

// Tüm makinaların grup-parça özet listesini getir
router.get('/overview', makinaGroupPartsController.getAllMakinaGroupPartsOverview);

module.exports = router;
