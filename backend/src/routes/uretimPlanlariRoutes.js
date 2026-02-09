const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/uretimPlanlariController');

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.put('/:id/kalemler', ctrl.updateItems);

module.exports = router;


