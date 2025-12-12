# 🎓 SIAKAD Mini - Fullstack Vue 3 & Node.js

**Sistem Informasi Akademik (SIAKAD) Mini** adalah aplikasi manajemen akademik modern yang dibangun dengan arsitektur **Monorepo** (Frontend & Backend terpisah). Proyek ini mendemonstrasikan implementasi Fullstack JavaScript yang kuat dengan fokus pada integritas data, relasi database kompleks, dan pelaporan profesional.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue](https://img.shields.io/badge/frontend-Vue_3-42b883.svg)
![Node](https://img.shields.io/badge/backend-Express.js-black.svg)
![Status](https://img.shields.io/badge/status-Production_Ready-success)

## ✨ Fitur Unggulan

Aplikasi ini telah dilengkapi dengan logika bisnis setara sistem akademik nyata:

### 1. 📊 Manajemen Data Master
* **Mahasiswa:** CRUD dengan validasi **NIM Unik**, pencarian real-time, dan relasi otomatis ke Jurusan.
* **Jurusan:** Manajemen data fakultas dan jenjang pendidikan.
* **Matakuliah:** Validasi ketat **Kode MK (8-12 Karakter)** untuk menjaga standar data.

### 2. 📝 Kartu Rencana Studi (KRS) & Penilaian
Fitur inti yang menangani transaksi akademik kompleks:
* **Input Nilai Detail:** Mendukung komponen Tugas, Praktikum, UTS, dan UAS.
* **Kalkulator Otomatis:** Menghitung **Nilai Akhir** secara real-time dengan pembobotan dinamis.
* **Konversi Grade:** Otomatis mengonversi angka ke Huruf Mutu (**A, B, C, D, E**) sesuai standar Universitas.
* **Anti-Conflict:** Sistem mencegah duplikasi pengambilan matakuliah yang sama.

### 3. 🖨️ Cetak Laporan (PDF Generator)
Fitur pelaporan profesional menggunakan `html2pdf.js` dengan layout resmi:
* **Mode KHS:** Mencetak Kartu Hasil Studi per semester (Menampilkan IPS).
* **Mode Transkrip:** Mencetak seluruh riwayat nilai kumulatif (Menampilkan IPK).
* **Layout Resmi:** Kop surat Universitas Halu Oleo, tanda tangan Kaprodi, dan layout tabel tanpa border vertikal (Clean UI).

---

## 🛠️ Teknologi Stack

| Kategori | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Frontend** | **Vue.js 3** (Composition API) | Framework UI reaktif dan modern. |
| **Styling** | **Tailwind CSS** | Utility-first CSS untuk desain responsif & cepat. |
| **Backend** | **Node.js + Express** | RESTful API Server. |
| **Database** | **MySQL** | Relational Database dengan Foreign Key Constraints. |
| **HTTP Client** | **Axios** | Komunikasi data antara FE dan BE. |
| **Library** | **html2pdf.js** | Konversi HTML ke PDF client-side. |
| **Alerts** | **SweetAlert2** | Notifikasi user yang interaktif. |

---

## 📂 Struktur Proyek

```text
/ (Root Directory)
├── backend-api/        # Server Node.js & Logika Database
│   ├── config/         # Koneksi Database
│   ├── controllers/    # Logika Bisnis (CRUD, Validasi)
│   └── routes/         # Endpoint API
├── frontend-siakad/    # Aplikasi Vue.js
│   ├── src/
│   │   ├── components/ # File .vue (TableKrs, TableMahasiswa, dll)
│   │   └── utils/      # Helpers (SweetAlert wrapper)
└── database-backup/    # File .sql untuk migrasi/backup
```