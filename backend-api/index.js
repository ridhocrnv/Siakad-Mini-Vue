const express = require('express');
const cors = require('cors');
require('dotenv').config();

// --- IMPORT ROUTES ---
// Pastikan file-file ini ada di folder routes/
const mahasiswaRoutes = require('./routes/mahasiswaRoutes');
const jurusanRoutes = require('./routes/jurusanRoutes');
const matakuliahRoutes = require('./routes/matakuliahRoutes');
const krsRoutes = require('./routes/krsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE ---
// 1. CORS: Agar Vue.js (biasanya port 5173/8080) bisa akses backend ini
app.use(cors());

// 2. Body Parser: Agar bisa membaca data JSON dari request body (POST/PUT)
app.use(express.json());

// 3. URL Encoded: Agar bisa membaca data dari form-urlencoded (opsional tapi bagus)
app.use(express.urlencoded({ extended: true }));

// --- ROUTING API ---
// Semua route akan diawali dengan /api

// 1. Route Mahasiswa (CRUD Mahasiswa)
app.use('/api/mahasiswa', mahasiswaRoutes);

// 2. Route Jurusan (Untuk Dropdown Jurusan di Frontend)
app.use('/api/jurusan', jurusanRoutes);

// 3. Route Matakuliah (CRUD Matakuliah)
app.use('/api/matakuliah', matakuliahRoutes);

// 4. Route KRS (Input KRS & Lihat Nilai)
app.use('/api/krs', krsRoutes);

// 5. Route Dashboard
app.use('/api/dashboard', dashboardRoutes);

// 6. Route Auth (Register & Login)
app.use('/api/auth', authRoutes);

// --- BASE ROUTE (TESTING) ---
app.get('/', (req, res) => {
    res.json({
        message: 'Selamat Datang di API Kampus Universitas Halu Oleo',
        version: '1.0.0',
        status: 'Server Running'
    });
});

// --- ERROR HANDLING (404 Not Found) ---
app.use((req, res, next) => {
    res.status(404).json({
        message: 'Endpoint tidak ditemukan. Cek kembali URL anda.'
    });
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.clear(); // Bersihkan terminal biar rapi
    console.log(`=================================================`);
    console.log(`🚀 Server berjalan di: http://localhost:${PORT}`);
    console.log(`📡 Database Host:      ${process.env.DB_HOST}`);
    console.log(`📂 Environment:        Dev - Linux Ubuntu`);
    console.log(`=================================================`);
});