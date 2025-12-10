<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import axios from 'axios';
import html2pdf from 'html2pdf.js'; // Import Library PDF

// --- STATE ---
const listKrs = ref([]);
const listMahasiswa = ref([]);
const listMatakuliah = ref([]);
const isLoading = ref(true);
const showModal = ref(false);
const isSubmitting = ref(false);
const editId = ref(null);

// State untuk Filter & Print
const selectedMahasiswaId = ref(''); // ID mahasiswa yang sedang dipilih untuk dilihat/print

const form = reactive({
    id_mahasiswa: '',
    id_matakuliah: '',
    semester: '20242',
    nilai_angka: '',
    nilai_huruf: ''
});

// --- API ACTIONS ---
const fetchKrs = async () => {
    isLoading.value = true;
    try {
        const response = await axios.get('http://localhost:3000/api/krs');
        if (response.data.success) listKrs.value = response.data.data;
    } catch (e) { console.error(e); }
    finally { isLoading.value = false; }
};

const fetchMahasiswa = async () => {
    try {
        const response = await axios.get('http://localhost:3000/api/mahasiswa');
        if (response.data.success) listMahasiswa.value = response.data.data;
    } catch (e) { console.error(e); }
};

const fetchMatakuliah = async () => {
    try {
        const response = await axios.get('http://localhost:3000/api/matakuliah');
        if (response.data.success) listMatakuliah.value = response.data.data;
    } catch (e) { console.error(e); }
};

const simpanData = async () => {
    try {
        isSubmitting.value = true;
        if (editId.value) {
            await axios.put(`http://localhost:3000/api/krs/${editId.value}`, form);
        } else {
            await axios.post('http://localhost:3000/api/krs', form);
        }
        alert("Berhasil!");
        tutupModal();
        fetchKrs();
    } catch (error) { alert("Gagal menyimpan data"); }
    finally { isSubmitting.value = false; }
};

const hapusData = async (id) => {
    if (confirm("Hapus data KRS ini?")) {
        try {
            await axios.delete(`http://localhost:3000/api/krs/${id}`);
            fetchKrs();
        } catch (e) { alert("Gagal hapus"); }
    }
};

// --- LOGIKA FILTER & PRINT ---

// Filter data KRS berdasarkan Mahasiswa yang dipilih di Dropdown
const filteredKrs = computed(() => {
    if (!selectedMahasiswaId.value) {
        return listKrs.value; // Kalau belum pilih, tampilkan semua (campur)
    }
    return listKrs.value.filter(item => item.id_mahasiswa == selectedMahasiswaId.value);
});

// Ambil Detail Mahasiswa yang sedang dipilih (untuk Header KRS)
const activeStudent = computed(() => {
    return listMahasiswa.value.find(m => m.id == selectedMahasiswaId.value);
});

// Fungsi Print PDF
const cetakPdf = () => {
    // 1. Ambil elemen HTML yang mau dicetak (id="area-cetak")
    const element = document.getElementById('area-cetak');

    // 2. Settingan PDF
    const opt = {
        margin: 1, // Margin pinggir kertas (cm)
        filename: `KRS_${activeStudent.value?.nim || 'Mahasiswa'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 }, // Resolusi biar tajam
        jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };

    // 3. Eksekusi
    html2pdf().set(opt).from(element).save();
};

// --- MODAL HELPERS ---
const bukaModalTambah = () => {
    editId.value = null;
    form.id_mahasiswa = selectedMahasiswaId.value || ''; // Auto select kalau sedang filter
    form.id_matakuliah = '';
    form.semester = '20242';
    form.nilai_angka = '';
    form.nilai_huruf = '';
    showModal.value = true;
};

const bukaModalEdit = (item) => {
    editId.value = item.id;
    form.id_mahasiswa = item.id_mahasiswa;
    form.id_matakuliah = item.id_matakuliah;
    form.semester = item.semester;
    form.nilai_angka = item.nilai_angka;
    form.nilai_huruf = item.nilai_huruf;
    showModal.value = true;
};

const tutupModal = () => { showModal.value = false; };

onMounted(() => {
    fetchKrs();
    fetchMahasiswa();
    fetchMatakuliah();
});
</script>

<template>
    <div>
        <div class="bg-white p-6 rounded-lg shadow-md">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-4">

                <div class="w-full md:w-1/2">
                    <label class="block text-sm font-bold text-gray-700 mb-1">Filter Mahasiswa (Untuk Cetak)</label>
                    <select v-model="selectedMahasiswaId"
                        class="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-indigo-500">
                        <option value="">-- Tampilkan Semua Data --</option>
                        <option v-for="mhs in listMahasiswa" :key="mhs.id" :value="mhs.id">
                            {{ mhs.nim }} - {{ mhs.nama_lengkap }}
                        </option>
                    </select>
                </div>

                <div class="flex gap-2">
                    <button v-if="selectedMahasiswaId && filteredKrs.length > 0" @click="cetakPdf"
                        class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 shadow">
                        🖨️ Cetak PDF
                    </button>

                    <button @click="bukaModalTambah"
                        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm">
                        + Input KRS
                    </button>
                </div>
            </div>

            <div id="area-cetak" class="p-4 bg-white">

                <div v-if="selectedMahasiswaId" class="mb-6 border-b-2 border-black pb-4">
                    <div class="text-center">
                        <h1 class="text-xl font-bold uppercase">Universitas Halu Oleo</h1>
                        <h2 class="text-lg font-semibold">Kartu Rencana Studi (KRS)</h2>
                        <p class="text-sm text-gray-600">Semester Genap 2024/2025</p>
                    </div>

                    <div class="mt-6 flex justify-between text-sm">
                        <div v-if="filteredKrs.length > 0">
                            <p><strong>NIM:</strong> {{ filteredKrs[0].nim }}</p>
                            <p><strong>Nama:</strong> {{ filteredKrs[0].nama_lengkap }}</p>
                            <p><strong>Jurusan:</strong> {{ filteredKrs[0].nama_jurusan }}</p>
                        </div>
                        <div v-if="filteredKrs.length > 0">
                            <p><strong>Fakultas:</strong> {{ filteredKrs[0].fakultas }}</p>
                            <p><strong>Jenjang:</strong> {{ filteredKrs[0].jenjang }}</p>
                            <p><strong>Semester Akademik:</strong> {{ filteredKrs[0].semester }}</p>
                        </div>
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="min-w-full border-collapse border border-gray-400">
                        <thead class="bg-gray-100">
                            <tr>
                                <th
                                    class="border border-gray-400 px-4 py-2 text-left text-sm font-bold text-black uppercase">
                                    No</th>
                                <th
                                    class="border border-gray-400 px-4 py-2 text-left text-sm font-bold text-black uppercase">
                                    Kode MK</th>
                                <th
                                    class="border border-gray-400 px-4 py-2 text-left text-sm font-bold text-black uppercase">
                                    Matakuliah</th>
                                <th
                                    class="border border-gray-400 px-4 py-2 text-center text-sm font-bold text-black uppercase">
                                    SKS</th>
                                <th
                                    class="border border-gray-400 px-4 py-2 text-center text-sm font-bold text-black uppercase">
                                    Nilai</th>
                                <th class="border border-gray-400 px-4 py-2 text-center text-sm font-bold text-black uppercase"
                                    data-html2canvas-ignore="true">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="filteredKrs.length === 0">
                                <td colspan="6" class="text-center p-4 text-gray-500 border border-gray-400">Belum ada
                                    matakuliah yang diambil.</td>
                            </tr>

                            <tr v-for="(item, index) in filteredKrs" :key="item.id">
                                <td class="border border-gray-400 px-4 py-2 text-center text-sm text-black">{{ index + 1
                                    }}</td>
                                <td class="border border-gray-400 px-4 py-2 text-sm text-black">{{ item.kode_mk }}</td>
                                <td class="border border-gray-400 px-4 py-2 text-sm text-black">{{ item.nama_mk }}</td>
                                <td class="border border-gray-400 px-4 py-2 text-center text-sm text-black">{{ item.sks
                                    }}</td>
                                <td class="border border-gray-400 px-4 py-2 text-center text-sm font-bold text-black">
                                    {{ item.nilai_huruf || '-' }}
                                </td>

                                <td class="border border-gray-400 px-4 py-2 text-center" data-html2canvas-ignore="true">
                                    <button @click="bukaModalEdit(item)"
                                        class="text-indigo-600 hover:underline text-xs mr-2">Edit</button>
                                    <button @click="hapusData(item.id)"
                                        class="text-red-600 hover:underline text-xs">Hapus</button>
                                </td>
                            </tr>

                            <tr v-if="selectedMahasiswaId">
                                <td colspan="3"
                                    class="border border-gray-400 px-4 py-2 text-right font-bold text-black">Total SKS
                                </td>
                                <td class="border border-gray-400 px-4 py-2 text-center font-bold text-black">
                                    {{filteredKrs.reduce((sum, item) => sum + item.sks, 0)}}
                                </td>
                                <td colspan="2" class="border border-gray-400"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-if="selectedMahasiswaId" class="mt-10 flex justify-end">
                    <div class="text-center w-64">
                        <p class="text-sm">Kendari, {{ new Date().toLocaleDateString('id-ID', {
                            day: 'numeric', month:
                            'long', year: 'numeric'}) }}</p>
                        <p class="text-sm mb-16">Mengetahui, Dosen Wali</p>
                        <p class="text-sm font-bold border-b border-black inline-block">Ridho Ahmad Irawan, S.Kom.,
                            M.Cs.</p>
                        <p class="text-xs">NIP. 199920202021</p>
                    </div>
                </div>

            </div>
        </div>

        <div v-if="showModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md h-auto max-h-[90vh] overflow-y-auto">
                <h2 class="text-2xl font-bold mb-6">{{ editId ? 'Edit KRS' : 'Input KRS' }}</h2>

                <form @submit.prevent="simpanData">

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Mahasiswa</label>
                        <select v-model="form.id_mahasiswa" class="border rounded w-full py-2 px-3" required>
                            <option value="">-- Pilih Mahasiswa --</option>
                            <option v-for="mhs in listMahasiswa" :key="mhs.id" :value="mhs.id">
                                {{ mhs.nim }} - {{ mhs.nama_lengkap }}
                            </option>
                        </select>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Matakuliah</label>
                        <select v-model="form.id_matakuliah" class="border rounded w-full py-2 px-3" required>
                            <option value="">-- Pilih Matakuliah --</option>
                            <option v-for="mk in listMatakuliah" :key="mk.id" :value="mk.id">
                                {{ mk.kode_mk }} - {{ mk.nama_mk }} ({{ mk.sks }} SKS)
                            </option>
                        </select>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Semester</label>
                        <input v-model="form.semester" type="text" class="border rounded w-full py-2 px-3"
                            placeholder="Contoh: 20242">
                    </div>

                    <div class="flex space-x-4 mb-4">
                        <div class="w-1/2">
                            <label class="block text-gray-700 text-sm font-bold mb-2">Nilai Angka</label>
                            <input v-model="form.nilai_angka" type="number" step="0.01"
                                class="border rounded w-full py-2 px-3">
                        </div>
                        <div class="w-1/2">
                            <label class="block text-gray-700 text-sm font-bold mb-2">Nilai Huruf</label>
                            <select v-model="form.nilai_huruf" class="border rounded w-full py-2 px-3">
                                <option value="">-</option>
                                <option value="A">A</option>
                                <option value="B+">B+</option>
                                <option value="B">B</option>
                                <option value="C+">C+</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                                <option value="E">E</option>
                            </select>
                        </div>
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