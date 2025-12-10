const express = require('express');
const router = express.Router();
const krsController = require('../controllers/krsController');

router.get('/', krsController.getAllKrs);
router.post('/', krsController.createKrs);
router.put('/:id', krsController.updateKrs);
router.delete('/:id', krsController.deleteKrs);

module.exports = router;