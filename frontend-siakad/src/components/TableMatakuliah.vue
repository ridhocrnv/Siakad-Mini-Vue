<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import axios from 'axios';
import { showToast, confirmDialog, showAlert } from '../utils/swal';

// --- STATE ---
const matakuliah = ref([]);
const listJurusan = ref([]); // Data Jurusan untuk Dropdown
const isLoading = ref(true);
const showModal = ref(false);
const isSubmitting = ref(false);
const editId = ref(null);

// STATE FILTER
const searchQuery = ref('');
const selectedSemesterFilter = ref('');
const selectedJurusanFilter = ref('');

const form = reactive({
    kode_mk: '',
    nama_mk: '',
    sks: 3,
    semester: 1,      // Default Semester 1
    id_jurusan: ''    // Default Kosong (MK Umum)
});

// --- COMPUTED HELPERS ---

// 1. Ambil List Semester yang unik dari data yang ada (biar dropdown filternya dinamis)
const uniqueSemesters = computed(() => {
    const sems = matakuliah.value.map(mk => mk.semester);
    return [...new Set(sems)].sort((a,b) => a - b);
});

// 2. Logic Filter Utama (Search + Semester + Jurusan)
const filteredMatakuliah = computed(() => {
    return matakuliah.value.filter(mk => {
        // A. Search Text
        const keyword = searchQuery.value.toLowerCase();
        const matchSearch = !keyword || 
            mk.kode_mk.toLowerCase().includes(keyword) || 
            mk.nama_mk.toLowerCase().includes(keyword);

        // B. Filter Semester
        const matchSemester = !selectedSemesterFilter.value || 
            mk.semester == selectedSemesterFilter.value;

        // C. Filter Jurusan
        // Jika filter jurusan dipilih, cocokkan ID. Jika MK Umum (null), tampilkan hanya jika filter kosong.
        const matchJurusan = !selectedJurusanFilter.value || 
            mk.id_jurusan == selectedJurusanFilter.value;

        return matchSearch && matchSemester && matchJurusan;
    });
});

// --- API ACTIONS ---

const fetchMatakuliah = async () => {
    isLoading.value = true;
    try {
        const response = await axios.get('http://localhost:3000/api/matakuliah');
        if (response.data.success) {
            matakuliah.value = response.data.data;
        }
    } catch (error) { console.error("Error:", error); } 
    finally { isLoading.value = false; }
};

const fetchJurusan = async () => {
    try {
        const response = await axios.get('http://localhost:3000/api/jurusan');
        if (response.data.success) {
            listJurusan.value = response.data.data;
        }
    } catch (error) { console.error("Error:", error); }
};

const simpanData = async () => {
    try {
        isSubmitting.value = true;
        if (editId.value) {
            await axios.put(`http://localhost:3000/api/matakuliah/${editId.value}`, form);
            showToast('Matakuliah berhasil diperbarui!');
        } else {
            await axios.post('http://localhost:3000/api/matakuliah', form);
            showToast('Matakuliah berhasil ditambahkan!');
        }
        tutupModal();
        fetchMatakuliah();
    } catch (error) {
        showAlert('Error', 'Gagal menyimpan data', 'error');
    } finally {
        isSubmitting.value = false;
    }
};

const hapusData = async (id, nama) => {
    const yakin = await confirmDialog('Hapus Matakuliah?', `MK ${nama} akan dihapus.`);
    if(yakin) {
        try {
            await axios.delete(`http://localhost:3000/api/matakuliah/${id}`);
            showToast('Matakuliah dihapus!');
            fetchMatakuliah();
        } catch (error) {
            showAlert('Gagal', 'Terjadi kesalahan sistem', 'error');
        }
    }
}

// --- MODAL HELPERS ---
const bukaModalTambah = () => {
    editId.value = null;
    form.kode_mk = ''; form.nama_mk = ''; form.sks = 3;
    form.semester = 1; form.id_jurusan = '';
    showModal.value = true;
};

const bukaModalEdit = (item) => {
    editId.value = item.id;
    form.kode_mk = item.kode_mk; form.nama_mk = item.nama_mk; form.sks = item.sks;
    form.semester = item.semester; form.id_jurusan = item.id_jurusan || '';
    showModal.value = true;
};

const tutupModal = () => { showModal.value = false; };

onMounted(() => {
    fetchJurusan();    // Ambil data jurusan dulu untuk dropdown
    fetchMatakuliah();
});
</script>

<template>
    <div>
        <div class="bg-white p-6 rounded-lg shadow-md relative">
            
            <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 class="text-xl font-bold text-gray-800">Daftar Matakuliah</h2>
                <button @click="bukaModalTambah" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm whitespace-nowrap md:hidden">
                    + Tambah MK
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                
                <div class="md:col-span-2">
                    <label class="text-xs font-bold text-gray-500 uppercase">Pencarian</label>
                    <div class="relative mt-1">
                        <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><i class="fas fa-search"></i></span>
                        <input v-model="searchQuery" type="text" placeholder="Cari Kode atau Nama MK..." class="pl-10 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                </div>

                <div>
                    <label class="text-xs font-bold text-gray-500 uppercase">Filter Semester</label>
                    <select v-model="selectedSemesterFilter" class="w-full mt-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                        <option value="">Semua Semester</option>
                        <option v-for="sem in uniqueSemesters" :key="sem" :value="sem">Semester {{ sem }}</option>
                    </select>
                </div>

                <div>
                    <label class="text-xs font-bold text-gray-500 uppercase">Filter Jurusan</label>
                    <select v-model="selectedJurusanFilter" class="w-full mt-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                        <option value="">Semua Jurusan</option>
                        <option v-for="jur in listJurusan" :key="jur.id" :value="jur.id">{{ jur.nama_jurusan }}</option>
                    </select>
                </div>
            </div>

            <div class="flex justify-end mb-4 hidden md:flex">
                <button @click="bukaModalTambah" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm whitespace-nowrap flex items-center gap-2 shadow-sm">
                    <i class="fas fa-plus"></i> Tambah MK
                </button>
            </div>

            <div v-if="isLoading" class="text-center py-4 text-gray-500">Loading...</div>
            <div class="overflow-x-auto rounded-lg border border-gray-200" v-else>
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Kode</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matakuliah</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">Smt</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">SKS</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jurusan</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-if="filteredMatakuliah.length === 0">
                            <td colspan="6" class="text-center p-8 text-gray-500">
                                <i class="fas fa-inbox text-3xl mb-2 text-gray-300"></i>
                                <p>Data tidak ditemukan.</p>
                            </td>
                        </tr>
                        <tr v-for="mk in filteredMatakuliah" :key="mk.id" class="hover:bg-gray-50">
                            <td class="px-6 py-4 text-sm font-bold text-gray-700">{{ mk.kode_mk }}</td>
                            <td class="px-6 py-4 text-sm text-gray-700 font-medium">{{ mk.nama_mk }}</td>
                            
                            <td class="px-6 py-4 text-sm text-center">
                                <span class="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded-full border border-gray-300">
                                    {{ mk.semester }}
                                </span>
                            </td>

                            <td class="px-6 py-4 text-sm text-center">
                                <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                                    {{ mk.sks }}
                                </span>
                            </td>

                            <td class="px-6 py-4 text-sm text-gray-600 italic">
                                {{ mk.nama_jurusan || 'MK Umum' }}
                            </td>

                            <td class="px-6 py-4 text-sm space-x-2">
                                <button @click="bukaModalEdit(mk)" class="text-indigo-600 font-bold hover:underline" title="Edit"><i class="fas fa-edit"></i></button>
                                <button @click="hapusData(mk.id, mk.nama_mk)" class="text-red-600 hover:underline" title="Hapus"><i class="fas fa-trash-alt"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="mt-4 text-xs text-gray-500 text-right">
                Menampilkan {{ filteredMatakuliah.length }} dari {{ matakuliah.length }} matakuliah
            </div>
        </div>

        <div v-if="showModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity">
            <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <h2 class="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">{{ editId ? 'Edit MK' : 'Tambah MK' }}</h2>
                <form @submit.prevent="simpanData">
                    
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Kode MK</label>
                        <input v-model="form.kode_mk" type="text" class="border rounded w-full py-2 px-3 focus:ring-2 focus:ring-green-500 outline-none" placeholder="Contoh: TIF123" required>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Nama Matakuliah</label>
                        <input v-model="form.nama_mk" type="text" class="border rounded w-full py-2 px-3 focus:ring-2 focus:ring-green-500 outline-none" required>
                    </div>

                    <div class="flex gap-4 mb-4">
                        <div class="w-1/2">
                            <label class="block text-gray-700 text-sm font-bold mb-2">SKS</label>
                            <input v-model="form.sks" type="number" min="1" max="6" class="border rounded w-full py-2 px-3 focus:ring-2 focus:ring-green-500 outline-none" required>
                        </div>
                        <div class="w-1/2">
                            <label class="block text-gray-700 text-sm font-bold mb-2">Semester</label>
                            <input v-model="form.semester" type="number" min="1" max="8" class="border rounded w-full py-2 px-3 focus:ring-2 focus:ring-green-500 outline-none" required>
                        </div>
                    </div>

                    <div class="mb-6">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Jurusan (Opsional)</label>
                        <select v-model="form.id_jurusan" class="border rounded w-full py-2 px-3 focus:ring-2 focus:ring-green-500 outline-none">
                            <option value="">-- Mata Kuliah Umum --</option>
                            <option v-for="jur in listJurusan" :key="jur.id" :value="jur.id">
                                {{ jur.nama_jurusan }}
                            </option>
                        </select>
                        <p class="text-xs text-gray-400 mt-1">*Kosongkan jika ini MK Umum (Pancasila, Agama, dll)</p>
                    </div>

                    <div class="flex justify-end space-x-2 pt-4 border-t">
                        <button type="button" @click="tutupModal" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Batal</button>
                        <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold shadow-md">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>