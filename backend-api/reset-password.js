// backend-api/reset-password.js
const db = require('./config/db');
const bcrypt = require('bcryptjs');

const resetAdmin = async () => {
    try {
        console.log("🔄 Sedang mereset password...");

        // 1. Password yang diinginkan
        const passwordPlain = 'password123';

        // 2. Enkripsi password menggunakan bcryptjs
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passwordPlain, salt);

        // 3. Update database
        const [result] = await db.query(
            'UPDATE users SET password = ? WHERE username = ?', 
            [hashedPassword, 'superadmin']
        );

        if (result.affectedRows > 0) {
            console.log("✅ SUKSES! Password berhasil diubah.");
            console.log("-------------------------------------");
            console.log("Username : superadmin");
            console.log("Password : " + passwordPlain);
            console.log("-------------------------------------");
        } else {
            console.log("❌ GAGAL: Username 'superadmin' tidak ditemukan di database.");
        }

        process.exit();

    } catch (error) {
        console.error("❌ ERROR SYSTEM:", error);
        process.exit(1);
    }
};

resetAdmin();