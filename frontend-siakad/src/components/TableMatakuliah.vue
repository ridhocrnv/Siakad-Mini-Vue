<script setup>
import { ref, onMounted, reactive, computed } from 'vue'; // Tambah 'computed'
import axios from 'axios';

const matakuliah = ref([]);
const isLoading = ref(true);
const showModal = ref(false);
const isSubmitting = ref(false);
const editId = ref(null);

// State Pencarian BARU
const searchQuery = ref('');

const form = reactive({
    kode_mk: '',
    nama_mk: '',
    sks: 3
});

// --- LOGIKA FILTER BARU ---
const filteredMatakuliah = computed(() => {
    if (!searchQuery.value) {
        return matakuliah.value;
    }
    
    const keyword = searchQuery.value.toLowerCase();
    
    return matakuliah.value.filter(mk => {
        // Cari berdasarkan Kode MK atau Nama MK
        const matchKode = mk.kode_mk.toLowerCase().includes(keyword);
        const matchNama = mk.nama_mk.toLowerCase().includes(keyword);
        return matchKode || matchNama;
    });
});
// ----------------------------


// --- API ACTIONS ---
const fetchMatakuliah = async () => {
    isLoading.value = true;
    try {
        const response = await axios.get('http://localhost:3000/api/matakuliah');
        if (response.data.success) {
            matakuliah.value = response.data.data;
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        isLoading.value = false;
    }
};

const simpanData = async () => {
    try {
        isSubmitting.value = true;
        if (editId.value) {
            await axios.put(`http://localhost:3000/api/matakuliah/${editId.value}`, form);
        } else {
            await axios.post('http://localhost:3000/api/matakuliah', form);
        }
        alert("Berhasil menyimpan data!");
        tutupModal();
        fetchMatakuliah();
    } catch (error) {
        alert("Gagal menyimpan data");
    } finally {
        isSubmitting.value = false;
    }
};

const hapusData = async (id, nama) => {
    if(confirm(`Hapus matakuliah ${nama}?`)) {
        try {
            await axios.delete(`http://localhost:3000/api/matakuliah/${id}`);
            fetchMatakuliah();
        } catch (error) {
            alert("Gagal menghapus");
        }
    }
}

// --- MODAL HELPERS ---
const bukaModalTambah = () => {
    editId.value = null;
    form.kode_mk = '';
    form.nama_mk = '';
    form.sks = 3;
    showModal.value = true;
};

const bukaModalEdit = (item) => {
    editId.value = item.id;
    form.kode_mk = item.kode_mk;
    form.nama_mk = item.nama_mk;
    form.sks = item.sks;
    showModal.value = true;
};

const tutupModal = () => {
    showModal.value = false;
};

onMounted(() => {
    fetchMatakuliah();
});
</script>

<template>
    <div>
        <div class="bg-white p-6 rounded-lg shadow-md">
            
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-4">
                <h2 class="text-xl font-bold text-gray-800">Daftar Matakuliah</h2>
                
                <div class="flex gap-2 w-full md:w-auto">
                    <input 
                        v-model="searchQuery" 
                        type="text" 
                        placeholder="Cari Kode atau Nama MK..." 
                        class="border rounded px-4 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                    <button @click="bukaModalTambah" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm whitespace-nowrap">
                        + Tambah MK
                    </button>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 border">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode MK</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Matakuliah</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKS</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-if="filteredMatakuliah.length === 0">
                            <td colspan="4" class="text-center p-4 text-gray-500">
                                {{ searchQuery ? 'Data tidak ditemukan.' : 'Data Kosong.' }}
                            </td>
                        </tr>
                        <tr v-for="mk in filteredMatakuliah" :key="mk.id" class="hover:bg-gray-50">
                            <td class="px-6 py-4 text-sm font-bold text-gray-700">{{ mk.kode_mk }}</td>
                            <td class="px-6 py-4 text-sm text-gray-700">{{ mk.nama_mk }}</td>
                            <td class="px-6 py-4 text-sm text-gray-700">
                                <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                    {{ mk.sks }} SKS
                                </span>
                            </td>
                            <td class="px-6 py-4 text-sm space-x-2">
                                <button @click="bukaModalEdit(mk)" class="text-indigo-600 font-bold hover:underline">Edit</button>
                                <button @click="hapusData(mk.id, mk.nama_mk)" class="text-red-600 hover:underline">Hapus</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-if="showModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <h2 class="text-2xl font-bold mb-6">{{ editId ? 'Edit MK' : 'Tambah MK' }}</h2>
                <form @submit.prevent="simpanData">
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Kode MK</label>
                        <input v-model="form.kode_mk" type="text" class="border rounded w-full py-2 px-3" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Nama Matakuliah</label>
                        <input v-model="form.nama_mk" type="text" class="border rounded w-full py-2 px-3" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">SKS</label>
                        <input v-model="form.sks" type="number" class="border rounded w-full py-2 px-3" required>
                    </div>
                    <div class="flex justify-end space-x-2">
                        <button type="button" @click="tutupModal" class="px-4 py-2 bg-gray-300 rounded">Batal</button>
                        <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>