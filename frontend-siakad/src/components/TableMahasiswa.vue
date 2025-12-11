<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import axios from 'axios';
import { showToast, confirmDialog, showAlert } from '../utils/swal';

// --- STATE ---
const mahasiswa = ref([]);
const listJurusan = ref([]); 
const isLoading = ref(true);
const errorMessage = ref('');
const showModal = ref(false);
const isSubmitting = ref(false);
const editId = ref(null);

// STATE FILTER & SEARCH
const searchQuery = ref('');
const selectedJurusanFilter = ref('');
const selectedFakultasFilter = ref('');

const form = reactive({
    nim: '',
    nama_lengkap: '',
    email: '',
    id_jurusan: '',
    jenis_kelamin: 'L',
    tanggal_lahir: ''
});

// --- COMPUTED HELPERS ---

const uniqueFakultas = computed(() => {
    const faculties = listJurusan.value.map(j => j.fakultas).filter(f => f);
    return [...new Set(faculties)].sort();
});

const filteredMahasiswa = computed(() => {
    return mahasiswa.value.filter(mhs => {
        // A. Filter Search
        const keyword = searchQuery.value.toLowerCase();
        const matchSearch = !keyword || 
            mhs.nim.toLowerCase().includes(keyword) || 
            mhs.nama_lengkap.toLowerCase().includes(keyword);

        // B. Filter Jurusan
        const matchJurusan = !selectedJurusanFilter.value || 
            mhs.id_jurusan == selectedJurusanFilter.value;

        // C. Filter Fakultas
        const jur = listJurusan.value.find(j => j.id === mhs.id_jurusan);
        const mhsFakultas = jur ? jur.fakultas : '';
        const matchFakultas = !selectedFakultasFilter.value || 
            mhsFakultas === selectedFakultasFilter.value;

        return matchSearch && matchJurusan && matchFakultas;
    });
});

// --- ACTIONS ---
const fetchData = async () => {
    isLoading.value = true;
    try {
        const response = await axios.get('http://localhost:3000/api/mahasiswa');
        if (response.data.success) mahasiswa.value = response.data.data;
    } catch (error) { errorMessage.value = "Gagal ambil data mahasiswa."; } 
    finally { isLoading.value = false; }
};

const fetchJurusan = async () => {
    try {
        const response = await axios.get('http://localhost:3000/api/jurusan');
        if(response.data.success) listJurusan.value = response.data.data;
    } catch (error) { console.error(error); }
};

const simpanMahasiswa = async () => {
    try {
        isSubmitting.value = true;
        if (editId.value) {
            await axios.put(`http://localhost:3000/api/mahasiswa/${editId.value}`, form);
            showToast('Data berhasil diperbarui!');
        } else {
            await axios.post('http://localhost:3000/api/mahasiswa', form);
            showToast('Data berhasil ditambahkan!');
        }
        tutupModal();
        fetchData(); 
    } catch (error) {
        showAlert('Error!', 'Gagal menyimpan data mahasiswa.', 'error');
    } finally {
        isSubmitting.value = false;
    }
};

const hapusMahasiswa = async (id, nama) => {
    const isConfirmed = await confirmDialog('Hapus Mahasiswa?', `Data ${nama} akan hilang permanen.`);
    if (isConfirmed) {
        try {
            await axios.delete(`http://localhost:3000/api/mahasiswa/${id}`);
            showToast('Data berhasil dihapus!', 'success');
            fetchData(); 
        } catch (error) { 
            showAlert('Gagal!', 'Terjadi kesalahan saat menghapus.', 'error'); 
        }
    }
};

// --- MODAL HELPERS ---
const bukaModalTambah = () => { editId.value = null; resetForm(); showModal.value = true; };
const bukaModalEdit = (data) => {
    editId.value = data.id;
    form.nim = data.nim;
    form.nama_lengkap = data.nama_lengkap;
    form.email = data.email;
    form.id_jurusan = data.id_jurusan;
    form.jenis_kelamin = data.jenis_kelamin;
    if (data.tanggal_lahir) form.tanggal_lahir = data.tanggal_lahir.split('T')[0];
    showModal.value = true;
};
const tutupModal = () => { showModal.value = false; resetForm(); editId.value = null; };
const resetForm = () => {
    form.nim = ''; form.nama_lengkap = ''; form.email = ''; form.id_jurusan = ''; 
    form.jenis_kelamin = 'L'; form.tanggal_lahir = '';
};

// --- DATA HELPERS (DISPLAY) ---

const getNamaJurusan = (id) => {
    const jurusan = listJurusan.value.find(j => j.id === id);
    return jurusan ? jurusan.nama_jurusan : '-';
};

// Helper Baru: Ambil Fakultas berdasarkan ID Jurusan
const getNamaFakultas = (id) => {
    const jurusan = listJurusan.value.find(j => j.id === id);
    return jurusan ? jurusan.fakultas : '-';
};

const formatDate = (dateString) => {
    if (!dateString || dateString === '0000-00-00') return '-';
    const date = new Date(dateString);
    if (isNaN(date)) return '-';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
};

onMounted(() => {
    fetchJurusan();
    fetchData();
});
</script>

<template>
    <div>
        <div class="bg-white p-6 rounded-lg shadow-md relative">
            
            <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 class="text-xl font-bold text-gray-800">Data Mahasiswa</h2>
                <button @click="bukaModalTambah" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm transition whitespace-nowrap md:hidden">
                    + Tambah
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                
                <div class="md:col-span-2">
                    <label class="text-xs font-bold text-gray-500 uppercase">Pencarian</label>
                    <div class="relative mt-1">
                        <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><i class="fas fa-search"></i></span>
                        <input v-model="searchQuery" type="text" placeholder="Cari NIM atau Nama..." class="pl-10 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    </div>
                </div>

                <div>
                    <label class="text-xs font-bold text-gray-500 uppercase">Filter Fakultas</label>
                    <select v-model="selectedFakultasFilter" class="w-full mt-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                        <option value="">Semua Fakultas</option>
                        <option v-for="fak in uniqueFakultas" :key="fak" :value="fak">{{ fak }}</option>
                    </select>
                </div>

                <div>
                    <label class="text-xs font-bold text-gray-500 uppercase">Filter Jurusan</label>
                    <select v-model="selectedJurusanFilter" class="w-full mt-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                        <option value="">Semua Jurusan</option>
                        <option v-for="jur in listJurusan.filter(j => !selectedFakultasFilter || j.fakultas === selectedFakultasFilter)" :key="jur.id" :value="jur.id">
                            {{ jur.nama_jurusan }}
                        </option>
                    </select>
                </div>
            </div>

            <div class="flex justify-end mb-4 hidden md:flex">
                <button @click="bukaModalTambah" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm transition shadow-sm flex items-center gap-2">
                    <i class="fas fa-plus"></i> Tambah Mahasiswa
                </button>
            </div>

            <div v-if="isLoading" class="text-center py-4 text-gray-500">Loading...</div>
            <div v-else-if="errorMessage" class="text-center py-4 text-red-500">{{ errorMessage }}</div>

            <div v-else class="overflow-x-auto rounded-lg border border-gray-200">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIM</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">L/P</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tgl Lahir</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jurusan</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fakultas</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-if="filteredMahasiswa.length === 0">
                            <td colspan="7" class="text-center p-8 text-gray-500">
                                <i class="fas fa-inbox text-3xl mb-2 text-gray-300"></i>
                                <p>Data tidak ditemukan sesuai filter.</p>
                            </td>
                        </tr>
                        <tr v-for="mhs in filteredMahasiswa" :key="mhs.id" class="hover:bg-gray-50 transition-colors">
                            <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ mhs.nim }}</td>
                            <td class="px-6 py-4 text-sm text-gray-700">
                                {{ mhs.nama_lengkap }} <br>
                                <span class="text-xs text-gray-400">{{ mhs.email }}</span>
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-700 font-bold">
                                <span :class="mhs.jenis_kelamin === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'" class="px-2 py-1 rounded text-xs">
                                    {{ mhs.jenis_kelamin }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-700">{{ formatDate(mhs.tanggal_lahir) }}</td>
                            <td class="px-6 py-4 text-sm text-gray-700">{{ getNamaJurusan(mhs.id_jurusan) }}</td>
                            
                            <td class="px-6 py-4 text-sm text-gray-500">{{ getNamaFakultas(mhs.id_jurusan) }}</td>
                            
                            <td class="px-6 py-4 text-sm font-medium space-x-2">
                                <button @click="bukaModalEdit(mhs)" class="text-indigo-600 hover:text-indigo-900" title="Edit"><i class="fas fa-edit"></i></button>
                                <button @click="hapusMahasiswa(mhs.id, mhs.nama_lengkap)" class="text-red-600 hover:text-red-900" title="Hapus"><i class="fas fa-trash-alt"></i></button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="mt-4 text-xs text-gray-500 text-right">
                Menampilkan {{ filteredMahasiswa.length }} dari {{ mahasiswa.length }} data
            </div>
        </div>

        <div v-if="showModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 backdrop-blur-sm transition-opacity">
            <div class="relative bg-white rounded-xl shadow-2xl p-8 w-full max-w-md transform transition-all scale-100">
                <h2 class="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">{{ editId ? 'Edit Mahasiswa' : 'Tambah Mahasiswa' }}</h2>
                <form @submit.prevent="simpanMahasiswa">
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">NIM</label>
                        <input v-model="form.nim" type="text" class="border rounded w-full py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Nama Lengkap</label>
                        <input v-model="form.nama_lengkap" type="text" class="border rounded w-full py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Email</label>
                        <input v-model="form.email" type="email" class="border rounded w-full py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Tanggal Lahir</label>
                        <input v-model="form.tanggal_lahir" type="date" class="border rounded w-full py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Jenis Kelamin</label>
                        <div class="flex gap-4">
                            <label class="inline-flex items-center cursor-pointer">
                                <input type="radio" v-model="form.jenis_kelamin" value="L" class="form-radio text-indigo-600"> <span class="ml-2">Laki-laki</span>
                            </label>
                            <label class="inline-flex items-center cursor-pointer">
                                <input type="radio" v-model="form.jenis_kelamin" value="P" class="form-radio text-pink-600"> <span class="ml-2">Perempuan</span>
                            </label>
                        </div>
                    </div>
                    <div class="mb-6">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Jurusan</label>
                        <select v-model="form.id_jurusan" class="border rounded w-full py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none" required>
                            <option disabled value="">-- Pilih Jurusan --</option>
                            <option v-for="jur in listJurusan" :key="jur.id" :value="jur.id">{{ jur.nama_jurusan }}</option>
                        </select>
                    </div>
                    <div class="flex justify-end space-x-3 mt-6 pt-4 border-t">
                        <button @click="tutupModal" type="button" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition">Batal</button>
                        <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition shadow-md font-bold">
                            {{ isSubmitting ? 'Menyimpan...' : (editId ? 'Update Data' : 'Simpan Data') }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>