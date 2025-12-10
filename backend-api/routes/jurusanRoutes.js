const express = require('express');
const router = express.Router();
const jurusanController = require('../controllers/jurusanController');

router.get('/', jurusanController.getAllJurusan);
router.post('/', jurusanController.createJurusan);
router.put('/:id', jurusanController.updateJurusan); // <--- Tambah baris ini
router.delete('/:id', jurusanController.deleteJurusan);

module.exports = router;