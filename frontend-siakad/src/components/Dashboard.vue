<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const stats = ref({
    mahasiswa: 0,
    jurusan: 0,
    matakuliah: 0,
    krs: 0
});

const isLoading = ref(true);

const fetchStats = async () => {
    try {
        const response = await axios.get('http://localhost:3000/api/dashboard');
        if (response.data.success) {
            stats.value = response.data.data;
        }
    } catch (error) {
        console.error("Gagal ambil statistik:", error);
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    fetchStats();
});
</script>

<template>
    <div>
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Dashboard Statistik</h2>
        
        <div v-if="isLoading" class="text-center py-10 text-gray-500">
            Sedang memuat data...
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div class="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 flex items-center justify-between">
                <div>
                    <p class="text-gray-500 text-sm font-medium uppercase">Total Mahasiswa</p>
                    <h3 class="text-3xl font-bold text-gray-800 mt-1">{{ stats.mahasiswa }}</h3>
                </div>
                <div class="bg-blue-100 p-3 rounded-full text-blue-600 text-2xl">
                    👨‍🎓
                </div>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500 flex items-center justify-between">
                <div>
                    <p class="text-gray-500 text-sm font-medium uppercase">Total Jurusan</p>
                    <h3 class="text-3xl font-bold text-gray-800 mt-1">{{ stats.jurusan }}</h3>
                </div>
                <div class="bg-green-100 p-3 rounded-full text-green-600 text-2xl">
                    🏫
                </div>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500 flex items-center justify-between">
                <div>
                    <p class="text-gray-500 text-sm font-medium uppercase">Matakuliah</p>
                    <h3 class="text-3xl font-bold text-gray-800 mt-1">{{ stats.matakuliah }}</h3>
                </div>
                <div class="bg-yellow-100 p-3 rounded-full text-yellow-600 text-2xl">
                    📚
                </div>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500 flex items-center justify-between">
                <div>
                    <p class="text-gray-500 text-sm font-medium uppercase">Data KRS</p>
                    <h3 class="text-3xl font-bold text-gray-800 mt-1">{{ stats.krs }}</h3>
                </div>
                <div class="bg-purple-100 p-3 rounded-full text-purple-600 text-2xl">
                    📝
                </div>
            </div>

        </div>

        <div class="mt-8 bg-indigo-600 rounded-lg shadow-lg p-6 text-white">
            <h3 class="text-xl font-bold">Selamat Datang di SIAKAD Mini! 🚀</h3>
            <p class="mt-2 text-indigo-100">
                Sistem Informasi Akademik sederhana untuk mengelola data Mahasiswa, Jurusan, Matakuliah, dan KRS.
                Gunakan menu di atas untuk mulai mengelola data.
            </p>
        </div>
    </div>
</template>