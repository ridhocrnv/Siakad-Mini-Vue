import { createApp } from 'vue'
import './style.css' // Style bawaan kamu (Tailwind)

// --- FONT AWESOME ---
import '@fortawesome/fontawesome-free/css/all.css' 
import '@fortawesome/fontawesome-free/js/all.js'

// --- DEPENDENCIES PENTING ---
import App from './App.vue'
import router from './router' // Import Router yang kita buat
import axios from 'axios'

// ==========================================
// KONFIGURASI AXIOS (SATPAM TOKEN)
// ==========================================

// 1. Request Interceptor: Tempel Token ke Header
// Setiap kali aplikasi minta data ke backend, token otomatis ikut.
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 2. Response Interceptor: Cek Token Basi
// Jika backend menolak (Error 401 Unauthorized), paksa logout.
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            // Hapus data login dari browser
            localStorage.clear();
            // Paksa reload ke halaman login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ==========================================
// MOUNT APLIKASI
// ==========================================
const app = createApp(App);

app.use(router); // Wajib: Aktifkan Router

app.mount('#app');