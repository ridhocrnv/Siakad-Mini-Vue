const db = require('../config/db');

// GET ALL
const getAllJurusan = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM jurusan ORDER BY kode_jurusan ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


const createJurusan = async (req, res) => {
    try {
        const { kode_jurusan, nama_jurusan, fakultas, jenjang } = req.body;
        
        // Validasi
        if (!kode_jurusan || !nama_jurusan || !fakultas || !jenjang) {
            return res.status(400).json({message: "Semua data (Kode, Nama, Fakultas, Jenjang) wajib diisi!"});
        }
        
        const sql = 'INSERT INTO jurusan (kode_jurusan, nama_jurusan, fakultas, jenjang) VALUES (?, ?, ?, ?)';
        await db.query(sql, [kode_jurusan, nama_jurusan, fakultas, jenjang]);
        
        res.status(201).json({ success: true, message: 'Jurusan berhasil dibuat' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// UPDATE (Update: Tambah fakultas & jenjang)
const updateJurusan = async (req, res) => {
    try {
        const { id } = req.params;
        const { kode_jurusan, nama_jurusan, fakultas, jenjang } = req.body;
        
        const sql = 'UPDATE jurusan SET kode_jurusan=?, nama_jurusan=?, fakultas=?, jenjang=? WHERE id=?';
        await db.query(sql, [kode_jurusan, nama_jurusan, fakultas, jenjang, id]);
        
        res.json({ success: true, message: 'Jurusan berhasil diupdate' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE
const deleteJurusan = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM jurusan WHERE id = ?', [id]);
        res.json({ success: true, message: 'Jurusan dihapus' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllJurusan, createJurusan, updateJurusan, deleteJurusan };