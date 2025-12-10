const db = require('../config/db');

// GET ALL
const getAllMahasiswa = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM mahasiswa ORDER BY id DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// CREATE (Perhatikan urutan variabelnya!)
const createMahasiswa = async (req, res) => {
    try {
        // 1. Ambil tanggal_lahir dari body
        const { nim, nama_lengkap, email, id_jurusan, jenis_kelamin, tanggal_lahir } = req.body;
        
        // Debugging (CCTV): Cek di terminal apakah tanggalnya masuk?
        console.log("Data Masuk:", req.body); 

        // 2. Pastikan Query SQL menyebutkan kolom 'tanggal_lahir'
        const sql = `INSERT INTO mahasiswa (nim, nama_lengkap, email, id_jurusan, jenis_kelamin, tanggal_lahir) VALUES (?, ?, ?, ?, ?, ?)`;
        
        // 3. Pastikan variable 'tanggal_lahir' ada di dalam array ini
        await db.query(sql, [nim, nama_lengkap, email, id_jurusan, jenis_kelamin, tanggal_lahir]);
        
        res.status(201).json({ success: true, message: 'Berhasil tambah data' });
    } catch (error) {
        console.error(error); // Biar error tampil di terminal
        res.status(500).json({ success: false, message: error.message });
    }
};

// UPDATE (Perhatikan urutan variabelnya!)
const updateMahasiswa = async (req, res) => {
    try {
        const { id } = req.params;
        const { nim, nama_lengkap, email, id_jurusan, jenis_kelamin, tanggal_lahir } = req.body;
        
        const sql = `UPDATE mahasiswa SET nim=?, nama_lengkap=?, email=?, id_jurusan=?, jenis_kelamin=?, tanggal_lahir=? WHERE id=?`;
        
        // Urutan di array harus SAMA PERSIS dengan urutan tanda tanya (?) di SQL
        await db.query(sql, [nim, nama_lengkap, email, id_jurusan, jenis_kelamin, tanggal_lahir, id]);
        
        res.json({ success: true, message: 'Berhasil update data' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE
const deleteMahasiswa = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM mahasiswa WHERE id = ?', [id]);
        res.json({ success: true, message: 'Berhasil hapus data' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllMahasiswa, createMahasiswa, updateMahasiswa, deleteMahasiswa };