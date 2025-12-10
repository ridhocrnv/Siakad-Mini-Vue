const db = require('../config/db');

// 1. GET ALL (Menggunakan LEFT JOIN untuk relasi data Mahasiswa, Matakuliah, dan Jurusan)
const getAllKrs = async (req, res) => {
    try {
        // Query menggunakan LEFT JOIN untuk memastikan semua data dari tabel 'krs' (tabel kiri) tetap tampil,
        // meskipun data Mahasiswa atau Matakuliah di relasi tengahnya ada yang tidak sinkron (NULL).
        const sql = `
            SELECT 
                krs.id, 
                krs.semester, 
                krs.nilai_angka, 
                krs.nilai_huruf,
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
            ORDER BY krs.semester DESC, m.nama_lengkap ASC
        `;
        
        const [rows] = await db.query(sql);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Gagal menjalankan query KRS:", error);
        res.status(500).json({ success: false, message: "Query SQL KRS Error" });
    }
};

// 2. CREATE (Input Data KRS)
const createKrs = async (req, res) => {
    try {
        const { id_mahasiswa, id_matakuliah, semester, nilai_angka, nilai_huruf } = req.body;
        
        if (!id_mahasiswa || !id_matakuliah || !semester) {
            return res.status(400).json({ success: false, message: "Mahasiswa, Matakuliah, dan Semester wajib diisi" });
        }

        const sql = `INSERT INTO krs (id_mahasiswa, id_matakuliah, semester, nilai_angka, nilai_huruf) VALUES (?, ?, ?, ?, ?)`;
        await db.query(sql, [id_mahasiswa, id_matakuliah, semester, nilai_angka || null, nilai_huruf || null]);

        res.status(201).json({ success: true, message: 'Data KRS berhasil disimpan' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal menambahkan data' });
    }
};

// 3. UPDATE (Edit Nilai atau Data KRS)
const updateKrs = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_mahasiswa, id_matakuliah, semester, nilai_angka, nilai_huruf } = req.body;

        const sql = `UPDATE krs SET id_mahasiswa=?, id_matakuliah=?, semester=?, nilai_angka=?, nilai_huruf=? WHERE id=?`;
        await db.query(sql, [id_mahasiswa, id_matakuliah, semester, nilai_angka || null, nilai_huruf || null, id]);

        res.json({ success: true, message: 'Data KRS berhasil diupdate' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal mengupdate data' });
    }
};

// 4. DELETE (Hapus Data KRS)
const deleteKrs = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM krs WHERE id = ?', [id]);
        res.json({ success: true, message: 'Data KRS dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal menghapus data' });
    }
};

module.exports = { getAllKrs, createKrs, updateKrs, deleteKrs };