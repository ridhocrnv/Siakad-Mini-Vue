const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Ambil token dari header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <TOKEN>"

    if (!token) {
        return res.status(403).json({ success: false, message: 'Akses Ditolak! Token tidak ditemukan.' });
    }

    try {
        // Verifikasi Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Simpan data user di request agar bisa dipakai controller lain
        next(); // Lanjut ke proses berikutnya
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Sesi habis, silakan login kembali.' });
    }
};

module.exports = { verifyToken };