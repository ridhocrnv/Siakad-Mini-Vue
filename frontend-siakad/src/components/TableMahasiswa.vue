<script setup>
import { ref, onMounted, reactive, computed } from 'vue'; // <--- Tambah 'computed'
import axios from 'axios';

import { showToast, confirmDialog, showAlert } from '../utils/swal'

// ... (State lama tetap sama: mahasiswa, listJurusan, dll) ...
const mahasiswa = ref([]);
const listJurusan = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');
const showModal = ref(false);
const isSubmitting = ref(false);
const editId = ref(null);

// STATE BARU UNTUK PENCARIAN
const searchQuery = ref('');

// ... (Form State & Actions Fetch/Create/Delete TETAP SAMA, jangan dihapus) ...
const form = reactive({
    nim: '',
    nama_lengkap: '',
    email: '',
    id_jurusan: '',
    jenis_kelamin: 'L',
    tanggal_lahir: ''
});

// ... (Copy paste function fetch, simpan, hapus, modal helpers dari kode sebelumnya) ...
// Supaya hemat tempat, saya tidak tulis ulang function-nya karena tidak berubah.
// Fokus ke logika Computed di bawah ini:

// --- LOGIKA FILTER & CARI ---
const filteredMahasiswa = computed(() => {
    // 1. Jika search kosong, kembalikan semua data
    if (!searchQuery.value) {
        return mahasiswa.value;
    }
    
    // 2. Jika ada ketikan, filter array
    const keyword = searchQuery.value.toLowerCase();
    
    return mahasiswa.value.filter(mhs => {
        // Cari berdasarkan NIM atau NAMA
        const matchNim = mhs.nim.toLowerCase().includes(keyword);
        const matchNama = mhs.nama_lengkap.toLowerCase().includes(keyword);
        return matchNim || matchNama;
    });
});

// ... (Helper functions getNamaJurusan, formatDate tetap sama) ...
// ... (fetchData tetap sama) ...

// Pastikan kode fetch data mahasiswa dan jurusan ada di sini
const fetchData = async () => {
    isLoading.value = true;
    try {
        const response = await axios.get('http://localhost:3000/api/mahasiswa');
        if (response.data.success) mahasiswa.value = response.data.data;
    } catch (error) { errorMessage.value = "Gagal ambil data."; } 
    finally { isLoading.value = false; }
};

const fetchJurusan = async () => {
    try {
        const response = await axios.get('http://localhost:3000/api/jurusan');
        if(response.data.success) listJurusan.value = response.data.data;
    } catch (e) { console.error(e); }
};

const getNamaJurusan = (id) => {
    const jurusan = listJurusan.value.find(j => j.id === id);
    return jurusan ? jurusan.nama_jurusan : '-';
};

const formatDate = (dateString) => {
    if (!dateString || dateString === '0000-00-00') return '-';
    const date = new Date(dateString);
    if (isNaN(date)) return '-';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
};

// ... (Function Simpan & Hapus tetap sama) ...
const simpanMahasiswa = async () => {
    try {
        isSubmitting.value = true;
        if (editId.value) {
            await axios.put(`http://localhost:3000/api/mahasiswa/${editId.value}`, form);
            showToast('Data berhasil diperbarui!'); // <--- GANTI ALERT
        } else {
            await axios.post('http://localhost:3000/api/mahasiswa', form);
            showToast('Data berhasil ditambahkan!'); // <--- GANTI ALERT
        }
        tutupModal();
        fetchData(); 
    } catch (error) {
        console.error(error);
        showAlert('Error!', 'Gagal menyimpan data mahasiswa.', 'error'); // <--- GANTI ALERT ERROR
    } finally {
        isSubmitting.value = false;
    }
};

const hapusMahasiswa = async (id, nama) => {
    // Pakai Confirm Dialog Custom
    const isConfirmed = await confirmDialog(
        'Hapus Mahasiswa?', 
        `Data ${nama} akan hilang permanen.`
    );

    if (isConfirmed) {
        try {
            await axios.delete(`http://localhost:3000/api/mahasiswa/${id}`);
            showToast('Data berhasil dihapus!', 'success'); // <--- TOAST
            fetchData(); 
        } catch (error) { 
            showAlert('Gagal!', 'Terjadi kesalahan saat menghapus.', 'error'); 
        }
    }
};
// ... Modal Helpers ...
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
const tutupModal = () => { showModal.value = false; resetForm(); };
const resetForm = () => { /* ... reset form ... */ 
    form.nim = ''; form.nama_lengkap = ''; form.email = ''; form.id_jurusan = ''; form.jenis_kelamin = 'L'; form.tanggal_lahir = '';
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
                
                <div class="flex gap-2 w-full md:w-auto">
                    <input 
                        v-model="searchQuery" 
                        type="text" 
                        placeholder="Cari NIM atau Nama..." 
                        class="border rounded px-4 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                    
                    <button @click="bukaModalTambah" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm transition whitespace-nowrap">
                        + Tambah
                    </button>
                </div>
            </div>

            <div v-if="isLoading" class="text-center py-4 text-gray-500">Loading...</div>
            <div v-else-if="errorMessage" class="text-center py-4 text-red-500">{{ errorMessage }}</div>

            <div v-else class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 border">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIM</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">L/P</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tgl Lahir</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jurusan</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-if="filteredMahasiswa.length === 0">
                            <td colspan="6" class="text-center p-4 text-gray-500">
                                {{ searchQuery ? 'Data tidak ditemukan.' : 'Data Kosong.' }}
                            </td>
                        </tr>
                        
                        <tr v-for="mhs in filteredMahasiswa" :key="mhs.id" class="hover:bg-gray-50">
                             <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ mhs.nim }}</td>
                            <td class="px-6 py-4 text-sm text-gray-700">
                                {{ mhs.nama_lengkap }} <br>
                                <span class="text-xs text-gray-400">{{ mhs.email }}</span>
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-700 font-bold">{{ mhs.jenis_kelamin }}</td>
                            <td class="px-6 py-4 text-sm text-gray-700">{{ formatDate(mhs.tanggal_lahir) }}</td>
                            <td class="px-6 py-4 text-sm text-gray-500">{{ getNamaJurusan(mhs.id_jurusan) }}</td>
                            <td class="px-6 py-4 text-sm font-medium space-x-2">
                                <button @click="bukaModalEdit(mhs)" class="text-indigo-600 hover:text-indigo-900 font-bold">Edit</button>
                                <button @click="hapusMahasiswa(mhs.id, mhs.nama_lengkap)" class="text-red-600 hover:text-red-900">Hapus</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-if="showModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
             <div class="relative bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                
                <h2 class="text-2xl font-bold mb-6 text-gray-800">
                    {{ editId ? 'Edit Mahasiswa' : 'Tambah Mahasiswa' }}
                </h2>
                
                <form @submit.prevent="simpanMahasiswa">
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">NIM</label>
                        <input v-model="form.nim" type="text" class="border rounded w-full py-2 px-3 text-gray-700" required>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Nama Lengkap</label>
                        <input v-model="form.nama_lengkap" type="text" class="border rounded w-full py-2 px-3 text-gray-700" required>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Email</label>
                        <input v-model="form.email" type="email" class="border rounded w-full py-2 px-3 text-gray-700" required>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Tanggal Lahir</label>
                        <input v-model="form.tanggal_lahir" type="date" class="border rounded w-full py-2 px-3 text-gray-700" required>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Jenis Kelamin</label>
                        <div class="flex gap-4">
                            <label class="inline-flex items-center">
                                <input type="radio" v-model="form.jenis_kelamin" value="L" class="form-radio text-indigo-600">
                                <span class="ml-2">Laki-laki</span>
                            </label>
                            <label class="inline-flex items-center">
                                <input type="radio" v-model="form.jenis_kelamin" value="P" class="form-radio text-pink-600">
                                <span class="ml-2">Perempuan</span>
                            </label>
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Jurusan</label>
                        <select v-model="form.id_jurusan" class="border rounded w-full py-2 px-3 text-gray-700" required>
                            <option disabled value="">-- Pilih Jurusan --</option>
                            <option v-for="jur in listJurusan" :key="jur.id" :value="jur.id">
                                {{ jur.nama_jurusan }}
                            </option>
                        </select>
                    </div>

                    <div class="flex justify-end space-x-3 mt-6">
                        <button @click="tutupModal" type="button" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">Batal</button>
                        <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                            {{ isSubmitting ? 'Menyimpan...' : (editId ? 'Update Data' : 'Simpan Data') }}
                        </button>
                    </div>
                </form>
            </div>
         </div>
    </div>
</template>