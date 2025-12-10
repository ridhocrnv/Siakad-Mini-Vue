const express = require('express');
const router = express.Router();
const mkController = require('../controllers/matakuliahController');

router.get('/', mkController.getAllMatakuliah);
router.post('/', mkController.createMatakuliah);
router.put('/:id', mkController.updateMatakuliah);
router.delete('/:id', mkController.deleteMatakuliah);

module.exports = router;