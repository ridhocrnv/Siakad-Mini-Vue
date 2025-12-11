<script setup>
import { ref, reactive } from 'vue';
import axios from 'axios';

// Event untuk memberitahu App.vue kalau login sukses
const emit = defineEmits(['loginSuccess']);

const isRegister = ref(false); // Mode: false = Login, true = Register
const isLoading = ref(false);
const errorMessage = ref('');

const form = reactive({
    nama_lengkap: '',
    username: '',
    password: ''
});

const submitForm = async () => {
    isLoading.value = true;
    errorMessage.value = '';
    
    // Tentukan URL tujuan (Login atau Register)
    const url = isRegister.value 
        ? 'http://localhost:3000/api/auth/register' 
        : 'http://localhost:3000/api/auth/login';

    try {
        const response = await axios.post(url, form);

        if (isRegister.value) {
            // Kalau habis register, pindah ke mode login
            alert(response.data.message);
            isRegister.value = false;
            form.password = ''; // Reset password
        } else {
            // Kalau Login Sukses
            // 1. Simpan Token & User di LocalStorage browser
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            // 2. Beritahu App.vue untuk ganti tampilan
            emit('loginSuccess');
        }

    } catch (error) {
        console.error(error);
        errorMessage.value = error.response?.data?.message || "Terjadi kesalahan server.";
    } finally {
        isLoading.value = false;
    }
};
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
        <div class="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
            
            <div class="text-center mb-6">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                    <i class="fas fa-graduation-cap text-3xl"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800">
                    {{ isRegister ? 'Buat Akun Baru' : 'Login SIAKAD' }}
                </h2>
                <p class="text-gray-500 text-sm mt-1">Sistem Informasi Akademik Mini</p>
            </div>

            <div v-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm text-center">
                {{ errorMessage }}
            </div>

            <form @submit.prevent="submitForm">
                
                <div v-if="isRegister" class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Nama Lengkap</label>
                    <input v-model="form.nama_lengkap" type="text" class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" required placeholder="Contoh: Admin Kampus">
                </div>

                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Username</label>
                    <input v-model="form.username" type="text" class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" required placeholder="Masukan username">
                </div>

                <div class="mb-6">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Password</label>
                    <input v-model="form.password" type="password" class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" required placeholder="********">
                </div>

                <button type="submit" :disabled="isLoading" class="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700 transition duration-300 disabled:opacity-50">
                    {{ isLoading ? 'Memproses...' : (isRegister ? 'Daftar Sekarang' : 'Masuk') }}
                </button>
            </form>

            <div class="mt-6 text-center text-sm">
                <p v-if="!isRegister">
                    Belum punya akun? 
                    <a @click="isRegister = true; errorMessage = ''" href="#" class="text-indigo-600 font-bold hover:underline">Daftar Admin</a>
                </p>
                <p v-else>
                    Sudah punya akun? 
                    <a @click="isRegister = false; errorMessage = ''" href="#" class="text-indigo-600 font-bold hover:underline">Login disini</a>
                </p>
            </div>

        </div>
    </div>
</template>