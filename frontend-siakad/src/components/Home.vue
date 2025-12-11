<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const stats = ref({
    mahasiswa: 0, jurusan: 0, matakuliah: 0, krs: 0
});
const isLoading = ref(true);

const fetchStats = async () => {
    try {
        const response = await axios.get('http://localhost:3000/api/dashboard');
        if (response.data.success) stats.value = response.data.data;
    } catch (error) { console.error(error); } 
    finally { isLoading.value = false; }
};

onMounted(() => fetchStats());
</script>

<template>
    <div class="space-y-6">
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white flex justify-between items-center">
            <div>
                <h2 class="text-3xl font-bold mb-2">Halo, Admin! 👋</h2>
                <p class="opacity-90">Selamat datang kembali di Dashboard SIAKAD Mini.</p>
            </div>
            <div class="hidden md:block text-6xl opacity-20"><i class="fas fa-chart-line"></i></div>
        </div>

        <div v-if="isLoading" class="text-center py-12 text-gray-500">Memuat data...</div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-xs font-bold text-gray-400 uppercase">Mahasiswa</p>
                        <h3 class="text-3xl font-extrabold text-gray-800 mt-2">{{ stats.mahasiswa }}</h3>
                    </div>
                    <div class="p-3 bg-blue-50 rounded-lg text-blue-600"><i class="fas fa-user-graduate text-xl"></i></div>
                </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-xs font-bold text-gray-400 uppercase">Jurusan</p>
                        <h3 class="text-3xl font-extrabold text-gray-800 mt-2">{{ stats.jurusan }}</h3>
                    </div>
                    <div class="p-3 bg-green-50 rounded-lg text-green-600"><i class="fas fa-university text-xl"></i></div>
                </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-xs font-bold text-gray-400 uppercase">Matakuliah</p>
                        <h3 class="text-3xl font-extrabold text-gray-800 mt-2">{{ stats.matakuliah }}</h3>
                    </div>
                    <div class="p-3 bg-yellow-50 rounded-lg text-yellow-600"><i class="fas fa-book text-xl"></i></div>
                </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-xs font-bold text-gray-400 uppercase">KRS Terisi</p>
                        <h3 class="text-3xl font-extrabold text-gray-800 mt-2">{{ stats.krs }}</h3>
                    </div>
                    <div class="p-3 bg-purple-50 rounded-lg text-purple-600"><i class="fas fa-file-signature text-xl"></i></div>
                </div>
            </div>
        </div>
    </div>
</template>