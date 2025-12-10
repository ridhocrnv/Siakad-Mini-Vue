// config/db.js
const mysql = require('mysql2/promise'); // <--- PENTING: Pakai /promise
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'db_mahasiswa',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Cek koneksi (Opsional, pakai async)
(async () => {
    try {
        const connection = await db.getConnection();
        console.log('✅ Database connected successfully (Promise Mode)!');
        connection.release();
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
    }
})();

module.exports = db;