const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import Controller & Middleware
const { login } = require('./controllers/authController');
const { verifyToken } = require('./middleware/authMiddleware');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// --- ROUTES ---

// 1. Route PUBLIC (Bebas akses)
app.post('/api/auth/login', login);

// 2. Route PROTECTED (Harus Login / Ada Token)
// Pasang 'verifyToken' sebelum controller route
app.use('/api/mahasiswa', verifyToken, require('./routes/mahasiswaRoutes'));
app.use('/api/jurusan', verifyToken, require('./routes/jurusanRoutes'));
app.use('/api/matakuliah', verifyToken, require('./routes/matakuliahRoutes'));
app.use('/api/krs', verifyToken, require('./routes/krsRoutes'));
app.use('/api/dashboard', verifyToken, require('./routes/dashboardRoutes')); // Asumsi ada

// Jalankan Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});