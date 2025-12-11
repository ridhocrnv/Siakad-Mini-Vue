<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import axios from 'axios';
import { showToast, confirmDialog, showAlert } from '../utils/swal';

const listJurusan = ref([]);
const isLoading = ref(true);
const showModal = ref(false);
const isSubmitting = ref(false);
const editId = ref(null);

// STATE FILTER
const searchQuery = ref('');
const selectedFakultasFilter = ref(''); // <--- State Filter Baru

const form = reactive({
    kode_jurusan: '',
    nama_jurusan: '',
    fakultas: '',
    jenjang: 'S1'
});

// --- COMPUTED ---

// 1. Ambil List Fakultas Unik dari Data Jurusan itu sendiri
const uniqueFakultas = computed(() => {
    const faculties = listJurusan.value.map(j => j.fakultas).filter(f => f);
    return [...new Set(faculties)].sort();
});

// 2. Logic Filter (Search + Fakultas)
const filteredJurusan = computed(() => {
    return listJurusan.value.filter(jurusan => {
        // A. Filter Search (Kode / Nama)
        const keyword = searchQuery.value.toLowerCase();
        const matchSearch = !keyword || 
            jurusan.kode_jurusan.toLowerCase().includes(keyword) || 
            jurusan.nama_jurusan.toLowerCase().includes(keyword);

        // B. Filter Fakultas
        const matchFakultas = !selectedFakultasFilter.value || 
            jurusan.fakultas === selectedFakultasFilter.value;

        return matchSearch && matchFakultas;
    });
});

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
    if(!form.kode_jurusan || !form.nama_jurusan || !form.fakultas) return showToast('Semua data wajib diisi!', 'warning');
    
    try {
        isSubmitting.value = true;
        if (editId.value) {
            await axios.put(`http://localhost:3000/api/jurusan/${editId.value}`, form);
            showToast('Jurusan berhasil diperbarui!');
        } else {
            await axios.post('http://localhost:3000/api/jurusan', form);
            showToast('Jurusan berhasil ditambahkan!');
        }
        tutupModal();
        fetchJurusan();
    } catch (e) {
        showAlert('Error', 'Gagal menyimpan data', 'error');
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
        } catch (e) { showAlert('Gagal', 'Gagal hapus (Data sedang dipakai?)', 'error'); }
    }
};

// --- MODAL ---
const bukaModalTambah = () => {
    editId.value = null;
    form.kode_jurusan = ''; form.nama_jurusan = ''; form.fakultas = ''; form.jenjang = 'S1';
    showModal.value = true;
};

const bukaModalEdit = (item) => {
    editId.value = item.id;
    form.kode_jurusan = item.kode_jurusan; form.nama_jurusan = item.nama_jurusan;
    form.fakultas = item.fakultas; form.jenjang = item.jenjang;
    showModal.value = true;
};

const tutupModal = () => { showModal.value = false; };

onMounted(() => {
    fetchJurusan();
});
</script>

<template>
    <div>
        <div class="bg-white p-6 rounded-lg shadow-md relative">
            
            <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 class="text-xl font-bold text-gray-800">Daftar Jurusan</h2>
                <button @click="bukaModalTambah" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm transition whitespace-nowrap md:hidden">
                    + Tambah
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                
                <div class="md:col-span-2">
                    <label class="text-xs font-bold text-gray-500 uppercase">Pencarian</label>
                    <div class="relative mt-1">
                        <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><i class="fas fa-search"></i></span>
                        <input v-model="searchQuery" type="text" placeholder="Cari Kode atau Nama Jurusan..." class="pl-10 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    </div>
                </div>

                <div>
                    <label class="text-xs font-bold text-gray-500 uppercase">Filter Fakultas</label>
                    <select v-model="selectedFakultasFilter" class="w-full mt-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                        <option value="">Semua Fakultas</option>
                        <option v-for="fak in uniqueFakultas" :key="fak" :value="fak">{{ fak }}</option>
                    </select>
                </div>
            </div>

            <div class="flex justify-end mb-4 hidden md:flex">
                <button @click="bukaModalTambah" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm transition shadow-sm flex items-center gap-2">
                    <i class="fas fa-plus"></i> Tambah Jurusan
                </button>
            </div>

            <div v-if="isLoading" class="text-center py-4 text-gray-500">Loading...</div>
            <div class="overflow-x-auto rounded-lg border border-gray-200" v-else>
                <table class="min-w-full divide-y divide-gray-200">
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
                            <td colspan="5" class="text-center p-8 text-gray-500">
                                <i class="fas fa-inbox text-3xl mb-2 text-gray-300"></i>
                                <p>Data tidak ditemukan.</p>
                            </td>
                        </tr>
                        <tr v-for="item in filteredJurusan" :key="item.id" class="hover:bg-gray-50 transition-colors">
                            <td class="px-6 py-4 text-sm font-bold text-gray-700">{{ item.kode_jurusan }}</td>
                            <td class="px-6 py-4 text-sm">
                                <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                                    {{ item.jenjang }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-700">{{ item.nama_jurusan }}</td>
                            <td class="px-6 py-4 text-sm text-gray-500 font-medium">{{ item.fakultas }}</td>
                            <td class="px-6 py-4 text-sm space-x-2">
                                <button @click="bukaModalEdit(item)" class="text-indigo-600 hover:text-indigo-900" title="Edit"><i class="fas fa-edit"></i></button>
                                <button @click="hapusData(item.id, item.nama_jurusan)" class="text-red-600 hover:text-red-900" title="Hapus"><i class="fas fa-trash-alt"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="mt-4 text-xs text-gray-500 text-right">
                Menampilkan {{ filteredJurusan.length }} dari {{ listJurusan.length }} jurusan
            </div>
        </div>

        <div v-if="showModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity">
            <div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm transform transition-all scale-100">
                <h2 class="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">{{ editId ? 'Edit Jurusan' : 'Tambah Jurusan' }}</h2>
                <form @submit.prevent="simpanData">
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Kode Jurusan</label>
                        <input v-model="form.kode_jurusan" type="text" class="border rounded w-full py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Contoh: TI" required>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Jenjang</label>
                        <select v-model="form.jenjang" class="border rounded w-full py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none">
                            <option value="D3">D3 (Diploma 3)</option>
                            <option value="D4">D4 (Sarjana Terapan)</option>
                            <option value="S1">S1 (Sarjana)</option>
                            <option value="S2">S2 (Magister)</option>
                        </select>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Nama Jurusan</label>
                        <input v-model="form.nama_jurusan" type="text" class="border rounded w-full py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Contoh: Teknik Informatika" required>
                    </div>

                    <div class="mb-6">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Fakultas</label>
                        <input v-model="form.fakultas" type="text" class="border rounded w-full py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Contoh: Teknik" required>
                    </div>

                    <div class="flex justify-end space-x-2 pt-4 border-t">
                        <button type="button" @click="tutupModal" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition">Batal</button>
                        <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition shadow-md font-bold">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>