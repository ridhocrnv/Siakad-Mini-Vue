<script setup>
import { ref, onMounted, reactive, computed, watch } from 'vue';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { showToast, confirmDialog, showAlert } from '../utils/swal';

// STATE UTAMA
const listKrs = ref([]); // Semua data KRS mentah
const listMahasiswa = ref([]); // List Mahasiswa untuk Sidebar Kiri
const listMatakuliah = ref([]); // Dropdown MK
const isLoading = ref(true);

// STATE UI
const selectedMahasiswaId = ref(null); // ID Mahasiswa yang sedang dilihat
const selectedSemesterFilter = ref(''); // Filter semester di panel kanan
const searchStudentQuery = ref(''); // Pencarian nama mahasiswa di panel kiri

// STATE MODAL
const showModal = ref(false);
const isSubmitting = ref(false);
const editId = ref(null);

const form = reactive({
    id_mahasiswa: '',
    id_matakuliah: '',
    semester: '20242',
    has_praktikum: false,
    nilai_tugas: 0, nilai_praktikum: 0, nilai_uts: 0, nilai_uas: 0,
    total_nilai: 0, nilai_angka: 0, nilai_huruf: 'E'
});

// --- LOGIC SEARCH MAHASISWA (PANEL KIRI) ---
const filteredStudentList = computed(() => {
    if (!searchStudentQuery.value) return listMahasiswa.value;
    const keyword = searchStudentQuery.value.toLowerCase();
    return listMahasiswa.value.filter(m => 
        m.nama_lengkap.toLowerCase().includes(keyword) || 
        m.nim.toLowerCase().includes(keyword)
    );
});

// --- LOGIC DETAIL KRS (PANEL KANAN) ---
// 1. Ambil Data Mahasiswa Aktif
const activeStudent = computed(() => {
    return listMahasiswa.value.find(m => m.id === selectedMahasiswaId.value);
});

// 2. Filter KRS milik Mahasiswa Aktif Saja
const studentKrsData = computed(() => {
    if (!selectedMahasiswaId.value) return [];
    return listKrs.value.filter(k => k.id_mahasiswa === selectedMahasiswaId.value);
});

// 3. Ambil List Semester yang dia punya
const availableSemesters = computed(() => {
    const sems = studentKrsData.value.map(k => k.semester);
    return [...new Set(sems)].sort((a,b) => b - a);
});

// 4. Filter Tabel Berdasarkan Semester (Jika dipilih)
const displayedKrs = computed(() => {
    if (!selectedSemesterFilter.value) return studentKrsData.value;
    return studentKrsData.value.filter(k => k.semester == selectedSemesterFilter.value);
});

// 5. Ambil Detail Jurusan/Fakultas (Ambil dari salah satu record KRS, atau kosongkan)
const activeStudentDetails = computed(() => {
    if (studentKrsData.value.length > 0) return studentKrsData.value[0];
    return null; // Kalau belum ada KRS, data jurusan ambil dari API Mahasiswa di masa depan (opsional)
});

// 6. Hitung IPS & IPK
const hitungIPS = computed(() => {
    if (!selectedSemesterFilter.value) return "0.00"; // IPS hanya muncul kalau pilih semester
    let totalSks = 0, totalMutu = 0;
    displayedKrs.value.forEach(k => {
        const sks = Number(k.sks || 0);
        const bobot = Number(k.nilai_angka || 0);
        totalSks += sks;
        totalMutu += (sks * bobot);
    });
    return totalSks === 0 ? "0.00" : (totalMutu / totalSks).toFixed(2);
});

const hitungIPK = computed(() => {
    // IPK selalu hitung semua data mahasiswa ini
    let totalSks = 0, totalMutu = 0;
    studentKrsData.value.forEach(k => {
        const sks = Number(k.sks || 0);
        const bobot = Number(k.nilai_angka || 0);
        totalSks += sks;
        totalMutu += (sks * bobot);
    });
    return totalSks === 0 ? "0.00" : (totalMutu / totalSks).toFixed(2);
});

// --- WATCHER RUMUS NILAI ---
watch(
    () => [form.nilai_tugas, form.nilai_praktikum, form.nilai_uts, form.nilai_uas, form.has_praktikum],
    ([tugas, prak, uts, uas, hasPrak]) => {
        let total = 0;
        if (hasPrak) {
            total = (Number(tugas) * 0.20) + (Number(prak) * 0.20) + (Number(uts) * 0.30) + (Number(uas) * 0.30);
        } else {
            total = (Number(tugas) * 0.30) + (Number(uts) * 0.35) + (Number(uas) * 0.35);
        }
        form.total_nilai = total.toFixed(2);
        
        if (total >= 80) { form.nilai_huruf = 'A'; form.nilai_angka = 4.0; }
        else if (total >= 75) { form.nilai_huruf = 'B+'; form.nilai_angka = 3.5; }
        else if (total >= 70) { form.nilai_huruf = 'B'; form.nilai_angka = 3.0; }
        else if (total >= 60) { form.nilai_huruf = 'C+'; form.nilai_angka = 2.5; }
        else if (total >= 50) { form.nilai_huruf = 'C'; form.nilai_angka = 2.0; }
        else if (total >= 40) { form.nilai_huruf = 'D'; form.nilai_angka = 1.0; }
        else { form.nilai_huruf = 'E'; form.nilai_angka = 0.0; }
    }
);

// --- ACTIONS ---
const fetchAllData = async () => {
    isLoading.value = true;
    try {
        const [krsRes, mhsRes, mkRes] = await Promise.all([
            axios.get('http://localhost:3000/api/krs'),
            axios.get('http://localhost:3000/api/mahasiswa'),
            axios.get('http://localhost:3000/api/matakuliah')
        ]);
        if(krsRes.data.success) listKrs.value = krsRes.data.data;
        if(mhsRes.data.success) listMahasiswa.value = mhsRes.data.data;
        if(mkRes.data.success) listMatakuliah.value = mkRes.data.data;
    } catch (e) { console.error(e); } 
    finally { isLoading.value = false; }
};

const selectStudent = (id) => {
    selectedMahasiswaId.value = id;
    selectedSemesterFilter.value = ''; // Reset filter semester saat ganti orang
};

const simpanData = async () => {
    try {
        isSubmitting.value = true;
        if (!form.has_praktikum) form.nilai_praktikum = 0;
        
        // Paksa ID Mahasiswa sesuai yg dipilih di panel kiri
        form.id_mahasiswa = selectedMahasiswaId.value;

        if (editId.value) {
            await axios.put(`http://localhost:3000/api/krs/${editId.value}`, form);
            showToast('Data Nilai Diperbarui!');
        } else {
            await axios.post('http://localhost:3000/api/krs', form);
            showToast('Matakuliah Ditambahkan ke KRS!');
        }
        tutupModal();
        fetchAllData();
    } catch (error) { showAlert('Error', 'Gagal menyimpan data', 'error'); } 
    finally { isSubmitting.value = false; }
};

const hapusData = async (id) => {
    const yakin = await confirmDialog('Hapus Matakuliah?', 'Data nilai ini akan dihapus dari KRS mahasiswa.');
    if(yakin) {
        try {
            await axios.delete(`http://localhost:3000/api/krs/${id}`);
            showToast('Terhapus!');
            fetchAllData();
        } catch (e) { showAlert('Error', 'Gagal hapus', 'error'); }
    }
};

const cetakPdf = () => {
    const element = document.getElementById('area-cetak');
    const opt = {
        margin: 1,
        filename: `KHS_${activeStudent.value?.nim}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
};

// --- MODAL HELPERS ---
const bukaModalTambah = () => {
    if (!selectedMahasiswaId.value) return showAlert('Pilih Mahasiswa', 'Silakan pilih mahasiswa di panel kiri dulu.', 'warning');
    
    editId.value = null;
    form.id_matakuliah = ''; 
    form.semester = selectedSemesterFilter.value || '20242'; // Auto semester
    form.has_praktikum = false;
    form.nilai_tugas = 0; form.nilai_praktikum = 0; form.nilai_uts = 0; form.nilai_uas = 0;
    form.total_nilai = 0; form.nilai_angka = 0; form.nilai_huruf = 'E';
    showModal.value = true;
};

const bukaModalEdit = (item) => {
    editId.value = item.id;
    form.id_matakuliah = item.id_matakuliah;
    form.semester = item.semester;
    
    form.nilai_praktikum = item.nilai_praktikum || 0;
    form.has_praktikum = form.nilai_praktikum > 0;
    form.nilai_tugas = item.nilai_tugas || 0;
    form.nilai_uts = item.nilai_uts || 0;
    form.nilai_uas = item.nilai_uas || 0;
    form.total_nilai = item.total_nilai || 0;
    form.nilai_angka = item.nilai_angka || 0;
    form.nilai_huruf = item.nilai_huruf || 'E';
    
    showModal.value = true;
};
const tutupModal = () => { showModal.value = false; };

onMounted(() => { fetchAllData(); });
</script>

<template>
    <div class="flex flex-col md:flex-row gap-6 h-[calc(100vh-100px)]">
        
        <div class="w-full md:w-1/3 bg-white rounded-lg shadow-md flex flex-col h-full">
            <div class="p-4 border-b">
                <h2 class="text-lg font-bold text-gray-800 mb-2">Pilih Mahasiswa</h2>
                <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><i class="fas fa-search"></i></span>
                    <input v-model="searchStudentQuery" type="text" placeholder="Cari Nama / NIM..." class="pl-10 w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                </div>
            </div>
            
            <div class="flex-1 overflow-y-auto p-2 space-y-2">
                <div v-if="isLoading" class="text-center py-4 text-gray-400 text-sm">Loading data...</div>
                
                <button 
                    v-for="mhs in filteredStudentList" 
                    :key="mhs.id"
                    @click="selectStudent(mhs.id)"
                    class="w-full text-left p-3 rounded-lg border transition-all duration-200 group"
                    :class="selectedMahasiswaId === mhs.id 
                        ? 'bg-indigo-50 border-indigo-500 shadow-sm' 
                        : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-300'"
                >
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-bold text-sm text-gray-800" :class="selectedMahasiswaId === mhs.id ? 'text-indigo-700' : ''">
                                {{ mhs.nama_lengkap }}
                            </p>
                            <p class="text-xs text-gray-500">{{ mhs.nim }}</p>
                        </div>
                        <i v-if="selectedMahasiswaId === mhs.id" class="fas fa-chevron-right text-indigo-500 text-xs mt-1"></i>
                    </div>
                </button>
            </div>
            
            <div class="p-3 border-t bg-gray-50 text-center text-xs text-gray-500 rounded-b-lg">
                Total {{ filteredStudentList.length }} Mahasiswa
            </div>
        </div>

        <div class="w-full md:w-2/3 bg-white rounded-lg shadow-md flex flex-col h-full overflow-hidden">
            
            <div v-if="!selectedMahasiswaId" class="flex-1 flex flex-col items-center justify-center text-gray-400">
                <i class="fas fa-user-graduate text-6xl mb-4 text-gray-200"></i>
                <p>Silakan pilih mahasiswa di panel kiri</p>
                <p class="text-sm">untuk melihat atau mengelola nilai KRS.</p>
            </div>

            <div v-else class="flex flex-col h-full">
                
                <div class="p-6 border-b bg-gray-50 flex justify-between items-start">
                    <div>
                        <h2 class="text-xl font-bold text-gray-800">{{ activeStudent.nama_lengkap }}</h2>
                        <p class="text-sm text-gray-600">{{ activeStudent.nim }}</p>
                        <div class="mt-2 flex gap-3">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                IPK: {{ hitungIPK }}
                            </span>
                            <span v-if="selectedSemesterFilter" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                IPS: {{ hitungIPS }}
                            </span>
                        </div>
                    </div>
                    
                    <div class="flex flex-col gap-2 items-end">
                         <select v-model="selectedSemesterFilter" class="border rounded px-2 py-1 text-sm bg-white focus:ring-1 focus:ring-indigo-500 w-48">
                            <option value="">-- Semua Semester --</option>
                            <option v-for="sem in availableSemesters" :key="sem" :value="sem">Semester {{ sem }}</option>
                        </select>
                        
                        <div class="flex gap-2 mt-1">
                            <button v-if="displayedKrs.length > 0" @click="cetakPdf" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs shadow flex items-center gap-1">
                                <i class="fas fa-print"></i> PDF
                            </button>
                            <button @click="bukaModalTambah" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs shadow flex items-center gap-1">
                                <i class="fas fa-plus"></i> Input Nilai
                            </button>
                        </div>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto p-0" id="area-cetak">
                    <div class="p-6 pb-0 hidden print-header">
                         <div class="text-center border-b-2 border-black pb-4 mb-4">
                            <h1 class="text-xl font-bold uppercase">Universitas Halu Oleo</h1>
                            <h2 class="text-lg font-semibold">{{ selectedSemesterFilter ? 'Kartu Hasil Studi' : 'Transkrip Nilai' }}</h2>
                        </div>
                    </div>

                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10">No</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matakuliah</th>
                                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">Smt</th>
                                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">SKS</th>
                                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">Total</th>
                                <th class="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase w-16 bg-yellow-50">Grade</th>
                                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24" data-html2canvas-ignore="true">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-if="displayedKrs.length === 0">
                                <td colspan="7" class="text-center p-8 text-gray-400 text-sm">
                                    Belum ada data nilai {{ selectedSemesterFilter ? `di semester ${selectedSemesterFilter}` : '' }}.
                                </td>
                            </tr>
                            <tr v-for="(item, index) in displayedKrs" :key="item.id" class="hover:bg-gray-50">
                                <td class="px-4 py-3 text-sm text-center text-gray-500">{{ index + 1 }}</td>
                                <td class="px-4 py-3 text-sm font-medium text-gray-900">
                                    {{ item.nama_mk }}
                                    <span class="block text-xs text-gray-400 font-normal">{{ item.kode_mk }}</span>
                                </td>
                                <td class="px-4 py-3 text-sm text-center text-gray-500">{{ item.semester }}</td>
                                <td class="px-4 py-3 text-sm text-center text-gray-500">{{ item.sks }}</td>
                                <td class="px-4 py-3 text-sm text-center text-gray-600 font-mono">{{ item.total_nilai }}</td>
                                <td class="px-4 py-3 text-sm text-center font-bold text-indigo-600 bg-yellow-50">{{ item.nilai_huruf }}</td>
                                <td class="px-4 py-3 text-center space-x-2" data-html2canvas-ignore="true">
                                    <button @click="bukaModalEdit(item)" class="text-indigo-600 hover:text-indigo-900 text-xs"><i class="fas fa-edit"></i></button>
                                    <button @click="hapusData(item.id)" class="text-red-600 hover:text-red-900 text-xs"><i class="fas fa-trash-alt"></i></button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div v-if="showModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h2 class="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
                    {{ editId ? 'Edit Nilai' : 'Input Nilai Baru' }}
                </h2>
                <div class="mb-4 bg-indigo-50 p-3 rounded text-sm text-indigo-700">
                    Input nilai untuk: <strong>{{ activeStudent.nama_lengkap }}</strong>
                </div>

                <form @submit.prevent="simpanData">
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="col-span-2">
                            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Matakuliah</label>
                            <select v-model="form.id_matakuliah" class="border rounded w-full py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500" required>
                                <option value="">-- Pilih Matakuliah --</option>
                                <option v-for="mk in listMatakuliah" :key="mk.id" :value="mk.id">
                                    [Smt {{ mk.semester }}] {{ mk.nama_mk }} ({{ mk.sks }} SKS)
                                </option>
                            </select>
                        </div>
                    </div>
                    <div class="mb-4">
                         <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Semester Akademik</label>
                        <input v-model="form.semester" type="text" class="border rounded w-full py-2 px-3 text-sm" required>
                    </div>

                    <div class="bg-gray-50 p-4 rounded border border-gray-200 mb-6">
                        <div class="flex justify-between items-center mb-3">
                            <h3 class="text-xs font-bold text-gray-700">Rincian Nilai</h3>
                            <label class="flex items-center cursor-pointer">
                                <span class="mr-2 text-[10px] font-bold" :class="form.has_praktikum ? 'text-indigo-600' : 'text-gray-400'">Praktikum?</span>
                                <input type="checkbox" v-model="form.has_praktikum" class="form-checkbox h-3 w-3 text-indigo-600">
                            </label>
                        </div>
                        
                        <div class="grid gap-2" :class="form.has_praktikum ? 'grid-cols-4' : 'grid-cols-3'">
                            <div>
                                <label class="block text-[10px] text-gray-500 text-center mb-1">Tugas</label>
                                <input v-model="form.nilai_tugas" type="number" min="0" max="100" class="border rounded w-full py-1 px-1 text-center text-sm font-bold">
                            </div>
                            <div v-if="form.has_praktikum">
                                <label class="block text-[10px] text-gray-500 text-center mb-1">Prak</label>
                                <input v-model="form.nilai_praktikum" type="number" min="0" max="100" class="border rounded w-full py-1 px-1 text-center text-sm font-bold bg-indigo-50 border-indigo-200">
                            </div>
                            <div>
                                <label class="block text-[10px] text-gray-500 text-center mb-1">UTS</label>
                                <input v-model="form.nilai_uts" type="number" min="0" max="100" class="border rounded w-full py-1 px-1 text-center text-sm font-bold">
                            </div>
                            <div>
                                <label class="block text-[10px] text-gray-500 text-center mb-1">UAS</label>
                                <input v-model="form.nilai_uas" type="number" min="0" max="100" class="border rounded w-full py-1 px-1 text-center text-sm font-bold">
                            </div>
                        </div>
                        
                        <div class="mt-3 pt-3 border-t flex justify-between items-center">
                            <div class="text-xs text-gray-500">Total: <strong class="text-gray-800 text-sm">{{ form.total_nilai }}</strong></div>
                            <div class="text-xs text-gray-500">Grade: <strong class="text-indigo-600 text-lg ml-1">{{ form.nilai_huruf }}</strong></div>
                        </div>
                    </div>

                    <div class="flex justify-end space-x-2">
                        <button type="button" @click="tutupModal" class="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">Batal</button>
                        <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-bold hover:bg-indigo-700">Simpan</button>
                    </div>
                </form>
            </div>
        </div>

    </div>
</template>

<style>
/* CSS Tambahan agar area cetak PDF rapi */
#area-cetak .print-header { display: block !important; }
/* Tapi sembunyikan di tampilan web biasa jika tidak sedang diprint oleh html2pdf */
/* (Html2pdf mengambil elemen apa adanya, jadi kita perlu trik di fungsi cetakPdf jika mau advanced, tapi code di atas sudah cukup menampilkan header tabel) */
</style>