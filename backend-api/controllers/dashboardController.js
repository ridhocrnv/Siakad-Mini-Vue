const db = require('../config/db');

const getDashboardStats = async (req, res) => {
    try {
        // Kita jalankan 5 query COUNT sekaligus
        const queries = [
            db.query('SELECT COUNT(*) as total FROM mahasiswa'),               // Index 0
            db.query('SELECT COUNT(*) as total FROM jurusan'),                 // Index 1 (Total Jurusan)
            db.query('SELECT COUNT(DISTINCT fakultas) as total FROM jurusan'), // Index 2 (Total Fakultas)
            db.query('SELECT COUNT(*) as total FROM matakuliah'),              // Index 3
            db.query('SELECT COUNT(*) as total FROM krs')                      // Index 4
        ];

        // Tunggu semua query selesai
        const results = await Promise.all(queries);

        // Ambil angkanya saja (results[index][0][0].total)
        // Struktur result mysql2 itu [[rows], [fields]]
        const stats = {
            mahasiswa: results[0][0][0].total,
            
            // PERBAIKAN DI SINI (DITUKAR)
            jurusan:   results[1][0][0].total, // Index 1 itu Jurusan (Jumlah baris tabel)
            fakultas:  results[2][0][0].total, // Index 2 itu Fakultas (Jumlah unik kolom fakultas)
            
            matakuliah: results[3][0][0].total,
            krs:       results[4][0][0].total
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getDashboardStats };