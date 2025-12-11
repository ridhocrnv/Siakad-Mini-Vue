<script setup>
import { ref, onMounted, reactive, computed } from 'vue'; // Tambah 'computed'
import axios from 'axios';

import { showToast, confirmDialog, showAlert } from '../utils/swal';

const listJurusan = ref([]);
const isLoading = ref(true);
const showModal = ref(false);
const isSubmitting = ref(false);
const editId = ref(null);

// State Pencarian BARU
const searchQuery = ref('');

const form = reactive({
    kode_jurusan: '',
    nama_jurusan: '',
    fakultas: '',
    jenjang: 'S1'
});

// --- LOGIKA FILTER BARU ---
const filteredJurusan = computed(() => {
    if (!searchQuery.value) {
        return listJurusan.value;
    }
    
    const keyword = searchQuery.value.toLowerCase();
    
    return listJurusan.value.filter(jurusan => {
        const matchKode = jurusan.kode_jurusan.toLowerCase().includes(keyword);
        const matchNama = jurusan.nama_jurusan.toLowerCase().includes(keyword);
        return matchKode || matchNama;
    });
});
// ----------------------------


// --- API ---
const fetchJurusan = async () => {
    isLoading.value = true;
    try {
        const response = await axios.get('http://localhost:3000/api/jurusan');
        if(response.data.success) listJurusan.value = response.data.data;
    } catch (e) { console.error(e); } 
    finally { isLoading.value = false; }
};

const simpanData = async () => {
    // Validasi
    if(!form.kode_jurusan || !form.nama_jurusan || !form.fakultas) {
        return showToast('Semua data wajib diisi!', 'warning'); // <--- Toast Warning
    }
    
    try {
        isSubmitting.value = true;
        if (editId.value) {
            await axios.put(`http://localhost:3000/api/jurusan/${editId.value}`, form);
        } else {
            await axios.post('http://localhost:3000/api/jurusan', form);
        }
        showToast('Data Jurusan tersimpan!'); // <--- Toast Success
        tutupModal();
        fetchJurusan();
    } catch (e) {
        showAlert('Error', 'Gagal menyimpan data jurusan', 'error');
    } finally {
        isSubmitting.value = false;
    }
};

const hapusData = async (id, nama) => {
    const isConfirmed = await confirmDialog('Hapus Jurusan?', `Jurusan ${nama} akan dihapus.`);
    
    if(isConfirmed) {
        try {
            await axios.delete(`http://localhost:3000/api/jurusan/${id}`);
            showToast('Jurusan terhapus!');
            fetchJurusan();
        } catch (e) { showAlert('Gagal', 'Tidak bisa hapus (mungkin ada mahasiswa?)', 'error'); }
    }
};

// --- MODAL ---
const bukaModalTambah = () => {
    editId.value = null;
    form.kode_jurusan = '';
    form.nama_jurusan = '';
    form.fakultas = '';
    form.jenjang = 'S1';
    showModal.value = true;
};

const bukaModalEdit = (item) => {
    editId.value = item.id;
    form.kode_jurusan = item.kode_jurusan;
    form.nama_jurusan = item.nama_jurusan;
    form.fakultas = item.fakultas;
    form.jenjang = item.jenjang;
    showModal.value = true;
};

const tutupModal = () => { showModal.value = false; };

onMounted(() => {
    fetchJurusan();
});
</script>

<template>
    <div>
        <div class="bg-white p-6 rounded-lg shadow-md">
            
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-4">
                <h2 class="text-xl font-bold text-gray-800">Daftar Jurusan</h2>
                
                <div class="flex gap-2 w-full md:w-auto">
                    <input 
                        v-model="searchQuery" 
                        type="text" 
                        placeholder="Cari Kode atau Nama Jurusan..." 
                        class="border rounded px-4 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                    <button @click="bukaModalTambah" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm whitespace-nowrap">
                        + Tambah
                    </button>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 border">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Kode</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenjang</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Jurusan</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fakultas</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-if="filteredJurusan.length === 0">
                            <td colspan="5" class="text-center p-4 text-gray-500">
                                {{ searchQuery ? 'Data tidak ditemukan.' : 'Data Kosong.' }}
                            </td>
                        </tr>
                        <tr v-for="item in filteredJurusan" :key="item.id" class="hover:bg-gray-50">
                            <td class="px-6 py-4 text-sm font-bold text-gray-700">{{ item.kode_jurusan }}</td>
                            <td class="px-6 py-4 text-sm">
                                <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                                    {{ item.jenjang }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-700">{{ item.nama_jurusan }}</td>
                            <td class="px-6 py-4 text-sm text-gray-500">{{ item.fakultas }}</td>
                            <td class="px-6 py-4 text-sm space-x-2">
                                <button @click="bukaModalEdit(item)" class="text-indigo-600 hover:underline">Edit</button>
                                <button @click="hapusData(item.id, item.nama_jurusan)" class="text-red-600 hover:underline">Hapus</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-if="showModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-sm">
                <h2 class="text-2xl font-bold mb-6">{{ editId ? 'Edit Jurusan' : 'Tambah Jurusan' }}</h2>
                <form @submit.prevent="simpanData">
                    
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Kode Jurusan</label>
                        <input v-model="form.kode_jurusan" type="text" class="border rounded w-full py-2 px-3" placeholder="Contoh: TI" required>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Jenjang</label>
                        <select v-model="form.jenjang" class="border rounded w-full py-2 px-3">
                            <option value="D3">D3 (Diploma 3)</option>
                            <option value="D4">D4 (Sarjana Terapan)</option>
                            <option value="S1">S1 (Sarjana)</option>
                            <option value="S2">S2 (Magister)</option>
                        </select>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Nama Jurusan</label>
                        <input v-model="form.nama_jurusan" type="text" class="border rounded w-full py-2 px-3" placeholder="Contoh: Teknik Informatika" required>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Fakultas</label>
                        <input v-model="form.fakultas" type="text" class="border rounded w-full py-2 px-3" placeholder="Contoh: Teknik" required>
                    </div>

                    <div class="flex justify-end space-x-2 mt-6">
                        <button type="button" @click="tutupModal" class="px-4 py-2 bg-gray-300 rounded">Batal</button>
                        <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>