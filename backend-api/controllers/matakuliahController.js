const db = require('../config/db');

// GET ALL (Update: JOIN Jurusan & ORDER BY Semester)
const getAllMatakuliah = async (req, res) => {
    try {
        const sql = `
            SELECT 
                mk.id, mk.kode_mk, mk.nama_mk, mk.sks, mk.semester, mk.id_jurusan,
                j.nama_jurusan, j.fakultas
            FROM matakuliah mk
            LEFT JOIN jurusan j ON mk.id_jurusan = j.id
            ORDER BY mk.semester ASC, j.nama_jurusan ASC, mk.nama_mk ASC
        `;
        const [rows] = await db.query(sql);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// CREATE (Update: Tambah semester & id_jurusan)
const createMatakuliah = async (req, res) => {
    try {
        const { kode_mk, nama_mk, sks, semester, id_jurusan } = req.body;
        
        if (!kode_mk || !nama_mk || !sks || !semester) {
            return res.status(400).json({ message: "Data wajib diisi" });
        }

        // id_jurusan boleh null (Misal MK Umum)
        const sql = `INSERT INTO matakuliah (kode_mk, nama_mk, sks, semester, id_jurusan) VALUES (?, ?, ?, ?, ?)`;
        await db.query(sql, [kode_mk, nama_mk, sks, semester, id_jurusan || null]);
        
        res.status(201).json({ success: true, message: 'Matakuliah berhasil dibuat' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// UPDATE (Update: Tambah semester & id_jurusan)
const updateMatakuliah = async (req, res) => {
    try {
        const { id } = req.params;
        const { kode_mk, nama_mk, sks, semester, id_jurusan } = req.body;
        
        const sql = `UPDATE matakuliah SET kode_mk=?, nama_mk=?, sks=?, semester=?, id_jurusan=? WHERE id=?`;
        await db.query(sql, [kode_mk, nama_mk, sks, semester, id_jurusan || null, id]);
        
        res.json({ success: true, message: 'Matakuliah berhasil diupdate' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE
const deleteMatakuliah = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM matakuliah WHERE id = ?', [id]);
        res.json({ success: true, message: 'Matakuliah dihapus' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllMatakuliah, createMatakuliah, updateMatakuliah, deleteMatakuliah };