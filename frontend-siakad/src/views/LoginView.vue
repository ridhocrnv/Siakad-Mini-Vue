<script setup>
import { ref, reactive } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { showToast, showAlert } from '../utils/swal'; 

const router = useRouter();
const isLoading = ref(false);
const form = reactive({
    username: '',
    password: ''
});

const handleLogin = async () => {
    if (!form.username || !form.password) {
        return showAlert('Peringatan', 'Username dan Password wajib diisi!', 'warning');
    }

    isLoading.value = true;

    try {
        // Tembak API Login
        const response = await axios.post('http://localhost:3000/api/auth/login', form);

        if (response.data.success) {
            // Simpan Token & User
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            showToast(`Selamat datang, ${response.data.user.nama_lengkap}!`);
            
            // Redirect ke Dashboard
            router.push('/'); 
        }
    } catch (error) {
        const msg = error.response?.data?.message || 'Gagal terhubung ke server';
        showAlert('Login Gagal', msg, 'error');
    } finally {
        isLoading.value = false;
    }
};
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div class="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm border-t-4 border-indigo-600 transform transition-all hover:scale-105 duration-300">
            
            <div class="text-center mb-8">
                <img src="/logo-uho.png" alt="Logo UHO" class="w-24 mx-auto mb-4 drop-shadow-md">
                
                <h2 class="text-2xl font-extrabold text-gray-800 tracking-tight">SIAKAD UHO</h2>
                <p class="text-xs text-gray-500 uppercase tracking-wide font-semibold mt-1">Administrator Access</p>
            </div>

            <form @submit.prevent="handleLogin" class="space-y-5">
                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Username</label>
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                            <i class="fas fa-user"></i>
                        </span>
                        <input 
                            v-model="form.username" 
                            type="text" 
                            class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-shadow"
                            placeholder="Masukkan username..." 
                            required
                        >
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Password</label>
                    <div class="relative">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                            <i class="fas fa-lock"></i>
                        </span>
                        <input 
                            v-model="form.password" 
                            type="password" 
                            class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-shadow"
                            placeholder="••••••••" 
                            required
                        >
                    </div>
                </div>

                <button 
                    type="submit" 
                    :disabled="isLoading"
                    class="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex justify-center items-center gap-2 transform active:scale-95"
                >
                    <span v-if="isLoading" class="flex items-center gap-2">
                        <i class="fas fa-circle-notch fa-spin"></i> Memproses...
                    </span>
                    <span v-else class="flex items-center gap-2">
                        Masuk <i class="fas fa-arrow-right"></i>
                    </span>
                </button>
            </form>

            <div class="mt-8 text-center border-t pt-4">
                <p class="text-[10px] text-gray-400">
                    &copy; 2025 Universitas Halu Oleo<br>
                    Kampus Hijau Bumi Tridharma
                </p>
            </div>
        </div>
    </div>
</template>