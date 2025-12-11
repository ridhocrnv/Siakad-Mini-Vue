const db = require('../config/db');

const getDashboardStats = async (req, res) => {
    try {
        const queries = [
            db.query('SELECT COUNT(*) as total FROM mahasiswa'),               
            db.query('SELECT COUNT(*) as total FROM jurusan'),                 
            db.query('SELECT COUNT(DISTINCT fakultas) as total FROM jurusan'), 
            db.query('SELECT COUNT(*) as total FROM matakuliah'),              
            
            // PERBAIKAN DISINI: Gunakan DISTINCT agar menghitung jumlah mahasiswa unik yg isi KRS
            db.query('SELECT COUNT(DISTINCT id_mahasiswa) as total FROM krs') 
        ];

        const results = await Promise.all(queries);

        // ... (console.log debug boleh dihapus atau dibiarkan)

        const stats = {
            mahasiswa: results[0][0][0].total,
            jurusan:   results[1][0][0].total,
            fakultas:  results[2][0][0].total,
            matakuliah: results[3][0][0].total,
            krs:       results[4][0][0].total // Sekarang isinya Jumlah Mahasiswa Aktif KRS
        };

        res.json({ success: true, data: stats });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getDashboardStats };