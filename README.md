# 💚 SIAKAD Mini - Fullstack Vue 3 & Node.js

**Sistem Informasi Akademik (SIAKAD) Mini** yang dibangun dengan *stack* modern: **Vue 3** (Frontend) dan **Node.js/Express.js** (Backend). Proyek ini merupakan implementasi operasi CRUD (Create, Read, Update, Delete) yang kompleks dan terintegrasi antar tabel (`mahasiswa`, `jurusan`, `matakuliah`, `krs`).

## ✨ Fitur dan Modul

Proyek ini telah mengimplementasikan seluruh fungsionalitas dasar SIAKAD:

| Modul | Fitur Utama | Status |
| :---: | :--- | :---: |
| **Dashboard** | Statistik Total Data (Mahasiswa, MK, Jurusan) | ✅ |
| **Data Mahasiswa** | CRUD, Pencarian Real-time, Detail Jurusan & Tanggal Lahir | ✅ |
| **Data Jurusan** | CRUD, Pencarian, Detail Fakultas & Jenjang (S1/D3) | ✅ |
| **Data Matakuliah** | CRUD, Pencarian Kode & Nama MK | ✅ |
| **Data KRS** | Transaksi Matakuliah (SQL JOIN 4 Tabel), Filter Mahasiswa | ✅ |
| **Cetak KRS** | Mengubah tampilan KRS yang difilter menjadi dokumen **PDF** (`html2pdf.js`). | ✅ |

## 🛠️ Teknologi Stack

Proyek ini memanfaatkan sepenuhnya ekosistem JavaScript modern:

| Kategori | Teknologi | Deskripsi |
| :---: | :--- | :--- |
| **Frontend** | **Vue.js (v3) + Vite** | Framework antarmuka pengguna cepat dan modern. |
| **Styling** | Tailwind CSS | Utility-first CSS framework untuk desain responsif. |
| **Backend** | Node.js + Express.js | Server API RESTful. |
| **Database** | MySQL | Database relasional (RDBMS) utama. |
| **Konektor** | Axios | HTTP client untuk komunikasi API. |

## ⚙️ Panduan Instalasi (Development)

Untuk menjalankan proyek ini di lingkungan lokal kamu, ikuti struktur folder yang sudah disepakati (`Siakad-Mini-Vue` sebagai root, dengan `mysql-backend` dan `frontend-siakad` di dalamnya):

### 1. Setup Database dan Backend

1.  Buat database MySQL baru (`db_siakad`) dan buat 4 tabel: `mahasiswa`, `jurusan`, `matakuliah`, dan `krs`.
2.  Navigasi ke folder **`mysql-backend`** dan instal dependensi:
    ```bash
    cd mysql-backend
    npm install
    ```
3.  Pastikan kredensial database lokal sudah diatur dengan benar di file konfigurasi (`db.js`).
4.  Jalankan server:
    ```bash
    node app.js 
    ```
    *(Server API berjalan di **`http://localhost:3000`**)*

### 2. Setup Frontend

1.  Buka terminal baru, navigasi ke folder **`frontend-siakad`**:
    ```bash
    cd frontend-siakad
    npm install
    ```
2.  Jalankan aplikasi Vue 3:
    ```bash
    npm run dev
    ```
    *(Aplikasi akan terbuka di browser di **`http://localhost:5173`**)*

**Aplikasi Fullstack SIAKAD (Vue & Node) kamu kini siap digunakan!**

---