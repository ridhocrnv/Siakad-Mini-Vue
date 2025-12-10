const db = require('../config/db');

// 1. GET ALL
const getAllMatakuliah = async (req, res) => {
    try {
        // Urutkan berdasarkan Kode MK biar rapi
        const [rows] = await db.query('SELECT * FROM matakuliah ORDER BY kode_mk ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. CREATE
const createMatakuliah = async (req, res) => {
    try {
        const { kode_mk, nama_mk, sks } = req.body;
        // Validasi simpel
        if (!kode_mk || !nama_mk || !sks) {
            return res.status(400).json({ success: false, message: "Semua data wajib diisi!" });
        }

        const sql = 'INSERT INTO matakuliah (kode_mk, nama_mk, sks) VALUES (?, ?, ?)';
        await db.query(sql, [kode_mk, nama_mk, sks]);
        
        res.status(201).json({ success: true, message: 'Matakuliah berhasil disimpan' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. UPDATE
const updateMatakuliah = async (req, res) => {
    try {
        const { id } = req.params;
        const { kode_mk, nama_mk, sks } = req.body;

        const sql = 'UPDATE matakuliah SET kode_mk=?, nama_mk=?, sks=? WHERE id=?';
        await db.query(sql, [kode_mk, nama_mk, sks, id]);

        res.json({ success: true, message: 'Matakuliah berhasil diupdate' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. DELETE
const deleteMatakuliah = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM matakuliah WHERE id = ?', [id]);
        res.json({ success: true, message: 'Matakuliah berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllMatakuliah, createMatakuliah, updateMatakuliah, deleteMatakuliah };