<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { showToast, confirmDialog, showAlert } from '../utils/swal';

// --- STATE ---
const listKrs = ref([]);
const listMahasiswa = ref([]);
const listMatakuliah = ref([]);
const isLoading = ref(true);
const showModal = ref(false);
const isSubmitting = ref(false);
const editId = ref(null);

// FILTER STATE
const selectedMahasiswaId = ref(''); // Filter Mahasiswa (Wajib pilih untuk lihat IPK)
const selectedSemesterFilter = ref(''); // Filter Semester (Untuk lihat IPS)

const form = reactive({
    id_mahasiswa: '',
    id_matakuliah: '',
    semester: '20242',
    nilai_angka: 0,
    nilai_huruf: ''
});

// --- COMPUTED LOGIC (THE BRAIN) ---

// 1. Ambil list semester unik dari data KRS mahasiswa yang dipilih
const availableSemesters = computed(() => {
    if (!selectedMahasiswaId.value) return [];
    // Filter KRS milik mahasiswa ini saja
    const studentKrs = listKrs.value.filter(k => k.id_mahasiswa == selectedMahasiswaId.value);
    // Ambil semesternya, unikkan, dan urutkan descending
    const sems = studentKrs.map(k => k.semester);
    return [...new Set(sems)].sort((a,b) => b - a);
});

// 2. Filter Tabel Utama
const filteredKrs = computed(() => {
    return listKrs.value.filter(item => {
        // Filter Mahasiswa
        const matchMhs = !selectedMahasiswaId.value || item.id_mahasiswa == selectedMahasiswaId.value;
        
        // Filter Semester (Hanya jika mahasiswa dipilih & semester dipilih)
        const matchSem = !selectedSemesterFilter.value || item.semester == selectedSemesterFilter.value;
        
        return matchMhs && matchSem;
    });
});

// 3. Detail Mahasiswa Aktif
const activeStudent = computed(() => {
    return listMahasiswa.value.find(m => m.id == selectedMahasiswaId.value);
});

const activeStudentDetails = computed(() => {
    if (filteredKrs.value.length > 0) return filteredKrs.value[0];
    // Fallback: Cari di listKrs global jika filtered kosong tapi mahasiswa terpilih
    if (selectedMahasiswaId.value) {
        return listKrs.value.find(k => k.id_mahasiswa == selectedMahasiswaId.value);
    }
    return null;
});

// 4. HITUNG IPS (Indeks Prestasi Semester)
// Berdasarkan data yang sedang TAMPIL di tabel (filteredKrs)
const hitungIPS = computed(() => {
    if (!selectedMahasiswaId.value || !selectedSemesterFilter.value) return "0.00";
    
    let totalSks = 0;
    let totalMutu = 0; // SKS * Nilai Angka

    filteredKrs.value.forEach(krs => {
        const sks = Number(krs.sks || 0);
        const nilai = Number(krs.nilai_angka || 0);
        totalSks += sks;
        totalMutu += (sks * nilai);
    });

    if (totalSks === 0) return "0.00";
    return (totalMutu / totalSks).toFixed(2);
});

// 5. HITUNG IPK (Indeks Prestasi Kumulatif)
// Berdasarkan SEMUA data KRS mahasiswa tersebut (abaikan filter semester)
const hitungIPK = computed(() => {
    if (!selectedMahasiswaId.value) return "0.00";

    // Ambil semua KRS milik mahasiswa ini
    const allKrsMhs = listKrs.value.filter(k => k.id_mahasiswa == selectedMahasiswaId.value);
    
    let totalSks = 0;
    let totalMutu = 0;

    allKrsMhs.forEach(krs => {
        const sks = Number(krs.sks || 0);
        const nilai = Number(krs.nilai_angka || 0);
        totalSks += sks;
        totalMutu += (sks * nilai);
    });

    if (totalSks === 0) return "0.00";
    return (totalMutu / totalSks).toFixed(2);
});


// --- ACTIONS ---
const fetchKrs = async () => {
    isLoading.value = true;
    try {
        const response = await axios.get('http://localhost:3000/api/krs');
        if(response.data.success) listKrs.value = response.data.data;
    } catch (e) { console.error(e); } 
    finally { isLoading.value = false; }
};
const fetchMahasiswa = async () => {
    try {
        const response = await axios.get('http://localhost:3000/api/mahasiswa');
        if(response.data.success) listMahasiswa.value = response.data.data;
    } catch (e) { console.error(e); }
};
const fetchMatakuliah = async () => {
    try {
        const response = await axios.get('http://localhost:3000/api/matakuliah');
        if(response.data.success) listMatakuliah.value = response.data.data;
    } catch (e) { console.error(e); }
};

const simpanData = async () => {
    try {
        isSubmitting.value = true;
        if (editId.value) {
            await axios.put(`http://localhost:3000/api/krs/${editId.value}`, form);
            showToast('KRS Update!');
        } else {
            await axios.post('http://localhost:3000/api/krs', form);
            showToast('KRS Tersimpan!');
        }
        tutupModal();
        fetchKrs();
    } catch (error) { showAlert('Gagal', 'Gagal menyimpan data', 'error'); } 
    finally { isSubmitting.value = false; }
};

const hapusData = async (id) => {
    const yakin = await confirmDialog('Hapus KRS?', 'Data ini akan dihapus.');
    if(yakin) {
        try {
            await axios.delete(`http://localhost:3000/api/krs/${id}`);
            showToast('KRS Dihapus');
            fetchKrs();
        } catch (e) { showAlert('Error', 'Gagal hapus', 'error'); }
    }
};

const cetakPdf = () => {
    const element = document.getElementById('area-cetak');
    const opt = {
        margin: 1,
        filename: `KRS_${activeStudent.value?.nim}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
};

// --- MODAL & FORM ---
const bukaModalTambah = () => {
    editId.value = null;
    form.id_mahasiswa = selectedMahasiswaId.value || ''; 
    form.id_matakuliah = '';
    form.semester = selectedSemesterFilter.value || '20242'; // Auto isi semester yg dipilih
    form.nilai_angka = 0; form.nilai_huruf = 'E';
    showModal.value = true;
};

const bukaModalEdit = (item) => {
    editId.value = item.id;
    form.id_mahasiswa = item.id_mahasiswa; form.id_matakuliah = item.id_matakuliah;
    form.semester = item.semester; form.nilai_angka = item.nilai_angka;
    form.nilai_huruf = item.nilai_huruf;
    showModal.value = true;
};
const tutupModal = () => { showModal.value = false; };

// Auto fill Nilai Angka saat Nilai Huruf berubah
const updateNilaiAngka = () => {
    const map = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'E': 0 };
    form.nilai_angka = map[form.nilai_huruf] || 0;
};

onMounted(() => {
    fetchKrs(); fetchMahasiswa(); fetchMatakuliah();
});
</script>

<template>
    <div>
        <div class="bg-white p-6 rounded-lg shadow-md">
            
            <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 border-b pb-4">
                
                <div class="flex flex-col md:flex-row gap-4 w-full md:w-2/3">
                    <div class="w-full md:w-1/2">
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Pilih Mahasiswa (Lihat Nilai)</label>
                        <select v-model="selectedMahasiswaId" @change="selectedSemesterFilter = ''" class="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-indigo-500 bg-white">
                            <option value="">-- Cari Mahasiswa --</option>
                            <option v-for="mhs in listMahasiswa" :key="mhs.id" :value="mhs.id">
                                {{ mhs.nim }} - {{ mhs.nama_lengkap }}
                            </option>
                        </select>
                    </div>

                    <div class="w-full md:w-1/2" v-if="selectedMahasiswaId">
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Pilih Semester</label>
                        <select v-model="selectedSemesterFilter" class="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-indigo-500 bg-white">
                            <option value="">-- Semua Semester (Transkrip) --</option>
                            <option v-for="sem in availableSemesters" :key="sem" :value="sem">Semester {{ sem }}</option>
                        </select>
                    </div>
                </div>

                <div class="flex gap-2">
                    <button v-if="selectedMahasiswaId && filteredKrs.length > 0" @click="cetakPdf" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 shadow transition">
                        <i class="fas fa-print"></i> PDF
                    </button>
                    <button @click="bukaModalTambah" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 transition">
                        <i class="fas fa-plus"></i> Input KRS
                    </button>
                </div>
            </div>

            <div v-if="selectedMahasiswaId" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                    <p class="text-xs text-indigo-500 font-bold uppercase">IPS (Smt {{ selectedSemesterFilter || 'Semua' }})</p>
                    <p class="text-2xl font-extrabold text-indigo-700">{{ hitungIPS }}</p>
                </div>
                <div class="bg-green-50 p-4 rounded-lg border border-green-100">
                    <p class="text-xs text-green-500 font-bold uppercase">IPK (Kumulatif)</p>
                    <p class="text-2xl font-extrabold text-green-700">{{ hitungIPK }}</p>
                </div>
            </div>

            <div id="area-cetak" class="bg-white p-2">
                
                <div v-if="selectedMahasiswaId" class="mb-6 border-b-2 border-black pb-4">
                    <div class="text-center">
                        <h1 class="text-xl font-bold uppercase">Universitas Halu Oleo</h1>
                        <h2 class="text-lg font-semibold">
                            {{ selectedSemesterFilter ? 'Kartu Hasil Studi (KHS)' : 'Transkrip Nilai Sementara' }}
                        </h2>
                        <p class="text-sm text-gray-600" v-if="selectedSemesterFilter">Semester {{ selectedSemesterFilter }}</p>
                    </div>
                    
                    <div class="mt-6 flex justify-between text-sm">
                        <div v-if="activeStudent">
                            <p><strong>NIM:</strong> {{ activeStudent.nim }}</p>
                            <p><strong>Nama:</strong> {{ activeStudent.nama_lengkap }}</p>
                            <p><strong>Jurusan:</strong> {{ activeStudentDetails?.nama_jurusan || '-' }}</p>
                        </div>
                        <div v-if="activeStudentDetails">
                            <p><strong>Fakultas:</strong> {{ activeStudentDetails.fakultas }}</p>
                            <p><strong>Jenjang:</strong> {{ activeStudentDetails.jenjang }}</p>
                        </div>
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="min-w-full border-collapse border border-gray-400">
                        <thead class="bg-gray-100">
                            <tr>
                                <th class="border border-gray-400 px-4 py-2 text-center text-xs font-bold uppercase">No</th>
                                <th class="border border-gray-400 px-4 py-2 text-center text-xs font-bold uppercase">Semester</th>
                                <th class="border border-gray-400 px-4 py-2 text-left text-xs font-bold uppercase">Kode MK</th>
                                <th class="border border-gray-400 px-4 py-2 text-left text-xs font-bold uppercase">Matakuliah</th>
                                <th class="border border-gray-400 px-4 py-2 text-center text-xs font-bold uppercase">SKS</th>
                                <th class="border border-gray-400 px-4 py-2 text-center text-xs font-bold uppercase">Nilai</th>
                                <th class="border border-gray-400 px-4 py-2 text-center text-xs font-bold uppercase" data-html2canvas-ignore="true">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="filteredKrs.length === 0">
                                <td colspan="7" class="text-center p-4 text-gray-500 border border-gray-400">Data tidak ditemukan.</td>
                            </tr>

                            <tr v-for="(item, index) in filteredKrs" :key="item.id">
                                <td class="border border-gray-400 px-4 py-2 text-center text-sm">{{ index + 1 }}</td>
                                <td class="border border-gray-400 px-4 py-2 text-center text-sm">{{ item.semester }}</td>
                                <td class="border border-gray-400 px-4 py-2 text-sm">{{ item.kode_mk }}</td>
                                <td class="border border-gray-400 px-4 py-2 text-sm">{{ item.nama_mk }}</td>
                                <td class="border border-gray-400 px-4 py-2 text-center text-sm">{{ item.sks }}</td>
                                <td class="border border-gray-400 px-4 py-2 text-center text-sm font-bold">{{ item.nilai_huruf }}</td>
                                
                                <td class="border border-gray-400 px-4 py-2 text-center" data-html2canvas-ignore="true">
                                    <button @click="bukaModalEdit(item)" class="text-indigo-600 hover:text-indigo-900 mr-2"><i class="fas fa-edit"></i></button>
                                    <button @click="hapusData(item.id)" class="text-red-600 hover:text-red-900"><i class="fas fa-trash-alt"></i></button>
                                </td>
                            </tr>
                            
                            <tr v-if="selectedMahasiswaId">
                                <td colspan="4" class="border border-gray-400 px-4 py-2 text-right font-bold">Total SKS</td>
                                <td class="border border-gray-400 px-4 py-2 text-center font-bold">
                                    {{ filteredKrs.reduce((sum, item) => sum + (item.sks || 0), 0) }}
                                </td>
                                <td colspan="2" class="border border-gray-400"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-if="selectedMahasiswaId" class="mt-10 flex justify-end">
                    <div class="text-center w-64">
                        <p class="text-sm">Kendari, {{ new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) }}</p>
                        <p class="text-sm mb-16">Mengetahui, Dosen Wali</p>
                        <p class="text-sm font-bold border-b border-black inline-block">Ridho Ahmad Irawan, S.Kom., M.Cs.</p>
                        <p class="text-xs">NIP. 199920202021</p>
                    </div>
                </div>

            </div>
        </div>

        <div v-if="showModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md h-auto max-h-[90vh] overflow-y-auto">
                <h2 class="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">{{ editId ? 'Edit Nilai' : 'Input Nilai' }}</h2>
                <form @submit.prevent="simpanData">
                    
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Mahasiswa</label>
                        <select v-model="form.id_mahasiswa" class="border rounded w-full py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none" required>
                            <option value="">-- Pilih Mahasiswa --</option>
                            <option v-for="mhs in listMahasiswa" :key="mhs.id" :value="mhs.id">
                                {{ mhs.nim }} - {{ mhs.nama_lengkap }}
                            </option>
                        </select>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Matakuliah</label>
                        <select v-model="form.id_matakuliah" class="border rounded w-full py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none" required>
                            <option value="">-- Pilih Matakuliah --</option>
                            <option v-for="mk in listMatakuliah" :key="mk.id" :value="mk.id">
                                [Sem {{ mk.semester }}] {{ mk.kode_mk }} - {{ mk.nama_mk }} ({{ mk.sks }} SKS)
                            </option>
                        </select>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Semester Akademik</label>
                        <input v-model="form.semester" type="text" class="border rounded w-full py-2 px-3" placeholder="Contoh: 20242" required>
                    </div>

                    <div class="flex gap-4 mb-6">
                        <div class="w-1/2">
                            <label class="block text-gray-700 text-sm font-bold mb-2">Nilai Huruf</label>
                            <select v-model="form.nilai_huruf" @change="updateNilaiAngka" class="border rounded w-full py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none" required>
                                <option value="A">A (4.0)</option>
                                <option value="B">B (3.0)</option>
                                <option value="C">C (2.0)</option>
                                <option value="D">D (1.0)</option>
                                <option value="E">E (0.0)</option>
                            </select>
                        </div>
                        <div class="w-1/2">
                            <label class="block text-gray-700 text-sm font-bold mb-2">Bobot</label>
                            <input v-model="form.nilai_angka" type="number" step="0.01" class="border rounded w-full py-2 px-3 bg-gray-100" readonly>
                        </div>
                    </div>

                    <div class="flex justify-end space-x-2 pt-4 border-t">
                        <button type="button" @click="tutupModal" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Batal</button>
                        <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold shadow-md">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>