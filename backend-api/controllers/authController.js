const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// KUNCI RAHASIA (Di project asli, taruh ini di .env)
const SECRET_KEY = 'rahasia_super_aman_siakad_uho'; 

// 1. REGISTER (Untuk membuat akun admin baru)
const register = async (req, res) => {
    try {
        const { nama_lengkap, username, password } = req.body;

        // Cek apakah username sudah ada?
        const [cekUser] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (cekUser.length > 0) {
            return res.status(400).json({ success: false, message: 'Username sudah digunakan!' });
        }

        // Enkripsi Password (Hashing)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Simpan ke Database
        await db.query('INSERT INTO users (nama_lengkap, username, password) VALUES (?, ?, ?)', 
            [nama_lengkap, username, hashedPassword]);

        res.status(201).json({ success: true, message: 'Registrasi berhasil! Silakan login.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. LOGIN (Untuk masuk ke dashboard)
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Cari User
        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        
        // Jika user tidak ketemu
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Username atau Password salah!' });
        }

        const user = users[0];

        // Cek Password (Bandingkan password input dengan hash di DB)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Username atau Password salah!' });
        }

        // Bikin Token JWT (Berlaku 1 Hari)
        const token = jwt.sign(
            { id: user.id, username: user.username }, 
            SECRET_KEY, 
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            message: 'Login berhasil',
            token: token,
            user: {
                id: user.id,
                nama: user.nama_lengkap,
                username: user.username
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { register, login };