const db = require('../config/db');

// 1. GET ALL (Sanitasi Data: Ubah NULL jadi 0)
const getAllKrs = async (req, res) => {
    try {
        const sql = `
            SELECT 
                krs.id, 
                krs.semester, 
                -- COALESCE akan mengubah NULL menjadi 0
                COALESCE(krs.nilai_tugas, 0) as nilai_tugas,
                COALESCE(krs.nilai_praktikum, 0) as nilai_praktikum,
                COALESCE(krs.nilai_uts, 0) as nilai_uts,
                COALESCE(krs.nilai_uas, 0) as nilai_uas,
                COALESCE(krs.total_nilai, 0) as total_nilai,
                COALESCE(krs.nilai_angka, 0) as nilai_angka,
                COALESCE(krs.nilai_huruf, 'E') as nilai_huruf,
                
                krs.id_mahasiswa,
                krs.id_matakuliah,
                m.nama_lengkap, 
                m.nim, 
                mk.nama_mk, 
                mk.kode_mk,
                mk.sks,      
                j.nama_jurusan,  
                j.fakultas,       
                j.jenjang         
            FROM krs
            LEFT JOIN mahasiswa m ON krs.id_mahasiswa = m.id
            LEFT JOIN matakuliah mk ON krs.id_matakuliah = mk.id
            LEFT JOIN jurusan j ON m.id_jurusan = j.id  
            ORDER BY m.nama_lengkap ASC, krs.semester DESC
        `;

        const [rows] = await db.query(sql);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Gagal query KRS:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// 2. CREATE
const createKrs = async (req, res) => {
    try {
        const { id_mahasiswa, id_matakuliah, semester, nilai_tugas, nilai_praktikum, nilai_uts, nilai_uas, total_nilai, nilai_angka, nilai_huruf } = req.body;
        
        if (!id_mahasiswa || !id_matakuliah) return res.status(400).json({ message: "Data wajib diisi" });

        const sql = `INSERT INTO krs (id_mahasiswa, id_matakuliah, semester, nilai_tugas, nilai_praktikum, nilai_uts, nilai_uas, total_nilai, nilai_angka, nilai_huruf) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        await db.query(sql, [id_mahasiswa, id_matakuliah, semester, nilai_tugas, nilai_praktikum || 0, nilai_uts, nilai_uas, total_nilai, nilai_angka, nilai_huruf]);

        res.status(201).json({ success: true, message: 'Data disimpan' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 3. UPDATE
const updateKrs = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_mahasiswa, id_matakuliah, semester, nilai_tugas, nilai_praktikum, nilai_uts, nilai_uas, total_nilai, nilai_angka, nilai_huruf } = req.body;

        const sql = `UPDATE krs SET id_mahasiswa=?, id_matakuliah=?, semester=?, nilai_tugas=?, nilai_praktikum=?, nilai_uts=?, nilai_uas=?, total_nilai=?, nilai_angka=?, nilai_huruf=? WHERE id=?`;
        await db.query(sql, [id_mahasiswa, id_matakuliah, semester, nilai_tugas, nilai_praktikum || 0, nilai_uts, nilai_uas, total_nilai, nilai_angka, nilai_huruf, id]);

        res.json({ success: true, message: 'Data diupdate' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 4. DELETE (Tetap sama)
const deleteKrs = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM krs WHERE id = ?', [id]);
        res.json({ success: true, message: 'Data dihapus' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { getAllKrs, createKrs, updateKrs, deleteKrs };