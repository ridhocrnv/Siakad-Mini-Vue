const db = require('../config/db');

const getDashboardStats = async (req, res) => {
    try {
        // Kita jalankan 4 query COUNT sekaligus
        const queries = [
            db.query('SELECT COUNT(*) as total FROM mahasiswa'),
            db.query('SELECT COUNT(*) as total FROM jurusan'),
            db.query('SELECT COUNT(*) as total FROM matakuliah'),
            db.query('SELECT COUNT(*) as total FROM krs')
        ];

        // Tunggu semua query selesai
        const results = await Promise.all(queries);

        // Ambil angkanya saja (results[index][0][0].total)
        // Struktur result mysql2 itu [[rows], [fields]]
        const stats = {
            mahasiswa: results[0][0][0].total,
            jurusan: results[1][0][0].total,
            matakuliah: results[2][0][0].total,
            krs: results[3][0][0].total
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