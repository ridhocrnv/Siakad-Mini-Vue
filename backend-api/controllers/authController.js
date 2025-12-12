const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Cek apakah user ada di database
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Username tidak ditemukan!' });
        }

        const user = users[0];

        // 2. Cek Password (Bandingkan input dengan Hash di DB)
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Password salah!' });
        }

        // 3. Buat Token JWT (Berlaku 24 jam)
        const token = jwt.sign(
            { id: user.id, role: user.role, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 4. Kirim respon sukses
        res.json({
            success: true,
            message: 'Login Berhasil',
            token: token,
            user: {
                id: user.id,
                nama_lengkap: user.nama_lengkap,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

module.exports = { login };