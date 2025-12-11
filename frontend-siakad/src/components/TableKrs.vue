<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { showToast, confirmDialog, showAlert } from '../utils/swal';

// --- STATE ---
const listKrs = ref([]); 
const listMahasiswa = ref([]); 
const listMatakuliah = ref([]); 
const listJurusan = ref([]); // Data Jurusan (untuk fallback)
const isLoading = ref(true);

const selectedMahasiswaId = ref(null); 
const selectedSemesterFilter = ref(''); 
const searchStudentQuery = ref(''); 

// MODAL
const showModal = ref(false);
const isSubmitting = ref(false);
const editId = ref(null);

const form = reactive({
    id_mahasiswa: '', id_matakuliah: '', semester: '20242', has_praktikum: false,
    nilai_tugas: 0, nilai_praktikum: 0, nilai_uts: 0, nilai_uas: 0,
    total_nilai: 0, nilai_angka: 0, nilai_huruf: 'E'
});

// ==========================================
// 1. SELECT STUDENT (LOGIC SEDERHANA & KUAT)
// ==========================================
const selectStudent = (id) => {
    console.log("Mengklik ID:", id); // Debugging
    
    // Pastikan ID valid angka
    const targetId = Number(id);

    // Jika klik orang yang sama, jangan refresh (biar gak kedip)
    if (selectedMahasiswaId.value === targetId) return;

    // Reset filter semester
    selectedSemesterFilter.value = '';
    
    // LANGSUNG SET (Tanpa null/nextTick yang bikin macet)
    selectedMahasiswaId.value = targetId;
    
    console.log("Mahasiswa Terpilih ID:", selectedMahasiswaId.value);
};

// Filter Pencarian (Sidebar Kiri)
const filteredStudentList = computed(() => {
    if (!listMahasiswa.value) return [];
    
    let data = listMahasiswa.value;

    // Deduplikasi Sederhana (Hanya jika ID benar-benar kembar)
    const uniqueIds = new Set();
    data = data.filter(m => {
        if (!uniqueIds.has(m.id)) {
            uniqueIds.add(m.id);
            return true;
        }
        return false;
    });

    // Sorting Nama
    data.sort((a, b) => (a.nama_lengkap || '').localeCompare(b.nama_lengkap || ''));

    // Searching
    if (searchStudentQuery.value) {
        const keyword = searchStudentQuery.value.toLowerCase().trim();
        return data.filter(m => 
            (m.nama_lengkap && m.nama_lengkap.toLowerCase().includes(keyword)) || 
            (m.nim && String(m.nim).toLowerCase().includes(keyword))
        );
    }
    return data;
});

// ==========================================
// 2. DETAIL DATA (COMPUTED)
// ==========================================
const activeStudent = computed(() => {
    if (!selectedMahasiswaId.value) return null;
    return listMahasiswa.value.find(m => m.id === selectedMahasiswaId.value);
});

// Ambil Jurusan (Cek di object mahasiswa dulu, kalau null baru cari di listJurusan)
const activeStudentJurusanInfo = computed(() => {
    if (!activeStudent.value) return null;
    
    // Prioritas 1: Data jurusan sudah nempel di object mahasiswa (dari JOIN backend)
    if (activeStudent.value.nama_jurusan) {
        return { 
            nama_jurusan: activeStudent.value.nama_jurusan, 
            fakultas: activeStudent.value.fakultas 
        };
    }

    // Prioritas 2: Cari manual di listJurusan (Fallback)
    if (listJurusan.value.length > 0 && activeStudent.value.id_jurusan) {
        return listJurusan.value.find(j => j.id == activeStudent.value.id_jurusan);
    }

    return { nama_jurusan: '-', fakultas: '-' };
});

const studentKrsData = computed(() => {
    if (!selectedMahasiswaId.value) return [];
    return listKrs.value.filter(k => k.id_mahasiswa === selectedMahasiswaId.value);
});

const displayedKrs = computed(() => {
    let data = studentKrsData.value;
    if (selectedSemesterFilter.value) {
        data = data.filter(k => k.semester == selectedSemesterFilter.value);
    }
    return data;
});

const availableSemesters = computed(() => {
    if (!studentKrsData.value.length) return [];
    const sems = studentKrsData.value.map(k => k.semester);
    return [...new Set(sems)].sort((a,b) => b - a);
});

// ==========================================
// 3. LOGIC NILAI
// ==========================================
const calculateGPA = (dataSet) => {
    if (!dataSet || dataSet.length === 0) return "0.00";
    let totalSks = 0, totalMutu = 0;
    dataSet.forEach(k => {
        const sks = parseFloat(k.sks) || 0;
        const bobot = parseFloat(k.nilai_angka) || 0;
        totalSks += sks;
        totalMutu += (sks * bobot);
    });
    return totalSks === 0 ? "0.00" : (totalMutu / totalSks).toFixed(2);
};
const hitungIPS = computed(() => calculateGPA(displayedKrs.value));
const hitungIPK = computed(() => calculateGPA(studentKrsData.value));

// Input Manual Logic
const hitungNilaiOtomatis = () => {
    const tugas = parseFloat(form.nilai_tugas) || 0;
    const prak = parseFloat(form.nilai_praktikum) || 0;
    const uts = parseFloat(form.nilai_uts) || 0;
    const uas = parseFloat(form.nilai_uas) || 0;

    let total = 0;
    if (form.has_praktikum) {
        total = (tugas * 0.20) + (prak * 0.20) + (uts * 0.30) + (uas * 0.30);
    } else {
        total = (tugas * 0.30) + (uts * 0.35) + (uas * 0.35);
    }
    form.total_nilai = parseFloat(total.toFixed(2));

    if (total >= 80) { form.nilai_huruf = 'A'; form.nilai_angka = 4.0; }
    else if (total >= 75) { form.nilai_huruf = 'B+'; form.nilai_angka = 3.5; }
    else if (total >= 70) { form.nilai_huruf = 'B'; form.nilai_angka = 3.0; }
    else if (total >= 60) { form.nilai_huruf = 'C+'; form.nilai_angka = 2.5; }
    else if (total >= 50) { form.nilai_huruf = 'C'; form.nilai_angka = 2.0; }
    else if (total >= 40) { form.nilai_huruf = 'D'; form.nilai_angka = 1.0; }
    else { form.nilai_huruf = 'E'; form.nilai_angka = 0.0; }
};

// ==========================================
// 4. API ACTIONS
// ==========================================
const fetchAllData = async () => {
    isLoading.value = true;
    try {
        const [krsRes, mhsRes, mkRes, jurRes] = await Promise.all([
            axios.get('http://localhost:3000/api/krs'),
            axios.get('http://localhost:3000/api/mahasiswa'),
            axios.get('http://localhost:3000/api/matakuliah'),
            axios.get('http://localhost:3000/api/jurusan')
        ]);
        listKrs.value = krsRes.data.data || [];
        listMahasiswa.value = mhsRes.data.data || [];
        listMatakuliah.value = mkRes.data.data || [];
        listJurusan.value = jurRes.data.data || [];
    } catch (e) { 
        showToast('Gagal memuat data', 'error');
    } finally { isLoading.value = false; }
};

const simpanData = async () => {
    try {
        isSubmitting.value = true;
        if (!form.has_praktikum) form.nilai_praktikum = 0;
        
        // KUNCI UTAMA: Paksa ID Mahasiswa dari yang sedang dipilih
        form.id_mahasiswa = selectedMahasiswaId.value; 

        if (editId.value) {
            await axios.put(`http://localhost:3000/api/krs/${editId.value}`, form);
            showToast('Nilai Updated!');
        } else {
            await axios.post('http://localhost:3000/api/krs', form);
            showToast('KRS Disimpan!');
        }
        tutupModal();
        fetchAllData();
    } catch (error) { 
        showAlert('Error', error.response?.data?.message || 'Gagal simpan', 'error'); 
    } finally { isSubmitting.value = false; }
};

const hapusData = async (id) => {
    const yakin = await confirmDialog('Hapus Matakuliah?', 'Data akan hilang.');
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
    if(!element) return;
    const opt = { margin: 1, filename: `KHS.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' } };
    html2pdf().set(opt).from(element).save();
};

// ==========================================
// 5. MODAL
// ==========================================
const bukaModalTambah = () => {
    if (!selectedMahasiswaId.value) {
        console.error("ID Mahasiswa Null!");
        return showAlert('Pilih Mahasiswa', 'Silakan pilih mahasiswa dulu', 'warning');
    }
    
    console.log("Membuka Modal untuk ID:", selectedMahasiswaId.value);
    
    editId.value = null;
    form.id_matakuliah = ''; 
    form.semester = selectedSemesterFilter.value || '20242'; 
    form.has_praktikum = false;
    form.nilai_tugas = 0; form.nilai_praktikum = 0; 
    form.nilai_uts = 0; form.nilai_uas = 0;
    form.total_nilai = 0; form.nilai_angka = 0; form.nilai_huruf = 'E';
    
    showModal.value = true;
};

const bukaModalEdit = (item) => {
    editId.value = item.id;
    form.id_matakuliah = item.id_matakuliah;
    form.semester = item.semester;
    form.nilai_praktikum = parseFloat(item.nilai_praktikum || 0);
    form.has_praktikum = form.nilai_praktikum > 0;
    form.nilai_tugas = parseFloat(item.nilai_tugas || 0);
    form.nilai_uts = parseFloat(item.nilai_uts || 0);
    form.nilai_uas = parseFloat(item.nilai_uas || 0);
    form.total_nilai = parseFloat(item.total_nilai || 0);
    form.nilai_angka = parseFloat(item.nilai_angka || 0);
    form.nilai_huruf = item.nilai_huruf;
    showModal.value = true;
};
const tutupModal = () => { showModal.value = false; };

onMounted(() => { fetchAllData(); });
</script>

<template>
    <div class="flex flex-col md:flex-row gap-6 h-[calc(100vh-120px)]">
        
        <div class="w-full md:w-1/3 bg-white rounded-lg shadow-md flex flex-col h-full border border-gray-200">
            <div class="p-4 border-b bg-gray-50 rounded-t-lg">
                <h2 class="text-sm font-bold text-gray-700 uppercase mb-2">Cari Mahasiswa</h2>
                <input v-model="searchStudentQuery" type="text" placeholder="Nama / NIM..." class="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            </div>
            
            <div class="flex-1 overflow-y-auto p-2 space-y-1">
                <div v-if="isLoading" class="text-center py-4 text-gray-400 text-sm">Loading...</div>
                
                <button 
                    v-for="mhs in filteredStudentList" 
                    :key="mhs.id"
                    @click="selectStudent(mhs.id)"
                    class="w-full text-left p-3 rounded-md border transition-all duration-200"
                    :class="selectedMahasiswaId === mhs.id ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-transparent hover:bg-gray-50'"
                >
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="font-bold text-sm text-gray-800" :class="selectedMahasiswaId === mhs.id ? 'text-indigo-700' : ''">{{ mhs.nama_lengkap }}</p>
                            <p class="text-[11px] text-gray-500 font-mono">{{ mhs.nim }}</p>
                        </div>
                        <i v-if="selectedMahasiswaId === mhs.id" class="fas fa-chevron-right text-indigo-500 text-xs"></i>
                    </div>
                </button>
            </div>
            <div class="p-2 border-t bg-gray-50 text-center text-[10px] text-gray-400">
                Total {{ filteredStudentList.length }} Mahasiswa
            </div>
        </div>

        <div class="w-full md:w-2/3 bg-white rounded-lg shadow-md flex flex-col h-full overflow-hidden border border-gray-200">
            <div v-if="!selectedMahasiswaId" class="flex-1 flex flex-col items-center justify-center text-gray-300 bg-gray-50">
                <i class="fas fa-user-graduate text-6xl mb-4 text-gray-200"></i>
                <p>Pilih mahasiswa di sebelah kiri.</p>
            </div>

            <div v-else class="flex flex-col h-full">
                <div class="p-6 border-b bg-white flex justify-between items-start">
                    <div v-if="activeStudent">
                        <h2 class="text-lg font-bold text-gray-800">{{ activeStudent.nama_lengkap }}</h2>
                        <p class="text-xs text-gray-500">{{ activeStudent.nim }}</p>
                        <p class="text-xs text-gray-600 mt-1 bg-gray-100 px-2 py-0.5 rounded inline-block">
                            {{ activeStudentJurusanInfo?.nama_jurusan || 'Jurusan -' }}
                        </p>
                    </div>
                    <div class="text-right flex flex-col gap-2">
                        <div class="flex gap-2 text-xs">
                            <span class="px-2 py-1 bg-green-50 text-green-700 rounded border border-green-100">IPK: <strong>{{ hitungIPK }}</strong></span>
                            <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100">IPS: <strong>{{ hitungIPS }}</strong></span>
                        </div>
                        <div class="flex gap-2">
                            <select v-model="selectedSemesterFilter" class="border rounded px-2 py-1 text-xs">
                                <option value="">Semua Smt</option>
                                <option v-for="sem in availableSemesters" :key="sem" :value="sem">Smt {{ sem }}</option>
                            </select>
                            <button @click="bukaModalTambah" class="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700">Input Nilai</button>
                            <button @click="cetakPdf" class="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"><i class="fas fa-print"></i></button>
                        </div>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto" id="area-cetak">
                    <div class="hidden print-header p-8 pb-0 text-center" v-if="activeStudent">
                        <h1 class="text-xl font-bold uppercase">Transkrip Akademik</h1>
                        <hr class="my-4 border-black">
                        <div class="text-left text-sm mb-4">
                            <p><strong>Nama:</strong> {{ activeStudent.nama_lengkap }}</p>
                            <p><strong>NIM:</strong> {{ activeStudent.nim }}</p>
                        </div>
                    </div>

                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50 sticky top-0 shadow-sm">
                            <tr>
                                <th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-10">No</th>
                                <th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-12">Smt</th>
                                <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Matakuliah</th>
                                <th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-12">SKS</th>
                                <th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-16">Total</th>
                                <th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-16">Grade</th>
                                <th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-20" data-html2canvas-ignore="true">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            <tr v-if="displayedKrs.length === 0">
                                <td colspan="7" class="text-center p-8 text-gray-400 text-sm">
                                    Belum ada data nilai.
                                </td>
                            </tr>
                            <tr v-for="(item, index) in displayedKrs" :key="item.id" class="hover:bg-gray-50">
                                <td class="px-4 py-3 text-center text-xs text-gray-500">{{ index + 1 }}</td>
                                <td class="px-4 py-3 text-center text-xs font-mono text-gray-500">{{ item.semester }}</td>
                                <td class="px-4 py-3 text-sm">
                                    <div class="font-medium text-gray-900">{{ item.nama_mk }}</div>
                                    <div class="text-[10px] text-gray-400">{{ item.kode_mk }}</div>
                                </td>
                                <td class="px-4 py-3 text-center text-xs text-gray-500">{{ item.sks }}</td>
                                <td class="px-4 py-3 text-center text-xs font-mono">{{ item.total_nilai }}</td>
                                <td class="px-4 py-3 text-center text-xs font-bold" :class="item.nilai_huruf === 'A' ? 'text-green-600' : 'text-gray-800'">{{ item.nilai_huruf }}</td>
                                <td class="px-4 py-3 text-center space-x-2" data-html2canvas-ignore="true">
                                    <button @click="bukaModalEdit(item)" class="text-indigo-600 hover:text-indigo-800 text-xs"><i class="fas fa-edit"></i></button>
                                    <button @click="hapusData(item.id)" class="text-red-600 hover:text-red-800 text-xs"><i class="fas fa-trash-alt"></i></button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div v-if="showModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
                <div class="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                    <h2 class="text-lg font-bold text-gray-800">{{ editId ? 'Edit Nilai' : 'Input Nilai Baru' }}</h2>
                    <button @click="tutupModal" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times"></i></button>
                </div>
                
                <form @submit.prevent="simpanData" class="p-6">
                    <div class="mb-4" v-if="activeStudent">
                        <div class="text-xs text-indigo-600 font-bold mb-1 uppercase tracking-wide">Mahasiswa</div>
                        <div class="text-sm font-bold text-gray-800 border p-2 rounded bg-indigo-50 border-indigo-100">
                            {{ activeStudent.nim }} - {{ activeStudent.nama_lengkap }}
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="col-span-2">
                            <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Matakuliah</label>
                            <select v-model="form.id_matakuliah" class="border rounded w-full py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required>
                                <option value="">Pilih Matakuliah</option>
                                <option v-for="mk in listMatakuliah" :key="mk.id" :value="mk.id">
                                    [Smt {{ mk.semester }}] {{ mk.nama_mk }} ({{ mk.sks }} SKS)
                                </option>
                            </select>
                        </div>
                    </div>
                    <div class="mb-4">
                         <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Semester Akademik</label>
                        <input v-model="form.semester" type="text" class="border rounded w-full py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required>
                    </div>

                    <div class="bg-gray-50 p-4 rounded border border-gray-200 mb-6">
                        <div class="flex justify-between items-center mb-3">
                            <h3 class="text-xs font-bold text-gray-700">Rincian Nilai</h3>
                            <label class="flex items-center cursor-pointer">
                                <span class="mr-2 text-[10px] font-bold text-indigo-600">Ada Praktikum?</span>
                                <input type="checkbox" v-model="form.has_praktikum" @change="hitungNilaiOtomatis" class="form-checkbox h-3 w-3 text-indigo-600 rounded">
                            </label>
                        </div>
                        
                        <div class="grid gap-2" :class="form.has_praktikum ? 'grid-cols-4' : 'grid-cols-3'">
                            <div>
                                <label class="block text-[10px] text-gray-500 text-center mb-1">Tugas</label>
                                <input v-model="form.nilai_tugas" @input="hitungNilaiOtomatis" type="number" min="0" max="100" class="border rounded w-full py-1 px-1 text-center text-sm font-bold focus:ring-1 focus:ring-indigo-500 outline-none">
                            </div>
                            <div v-if="form.has_praktikum">
                                <label class="block text-[10px] text-gray-500 text-center mb-1">Prak</label>
                                <input v-model="form.nilai_praktikum" @input="hitungNilaiOtomatis" type="number" min="0" max="100" class="border rounded w-full py-1 px-1 text-center text-sm font-bold bg-indigo-50 border-indigo-200 focus:ring-1 focus:ring-indigo-500 outline-none">
                            </div>
                            <div>
                                <label class="block text-[10px] text-gray-500 text-center mb-1">UTS</label>
                                <input v-model="form.nilai_uts" @input="hitungNilaiOtomatis" type="number" min="0" max="100" class="border rounded w-full py-1 px-1 text-center text-sm font-bold focus:ring-1 focus:ring-indigo-500 outline-none">
                            </div>
                            <div>
                                <label class="block text-[10px] text-gray-500 text-center mb-1">UAS</label>
                                <input v-model="form.nilai_uas" @input="hitungNilaiOtomatis" type="number" min="0" max="100" class="border rounded w-full py-1 px-1 text-center text-sm font-bold focus:ring-1 focus:ring-indigo-500 outline-none">
                            </div>
                        </div>
                        
                        <div class="mt-3 pt-3 border-t flex justify-between items-center">
                            <div class="text-xs text-gray-500">Total: <strong class="text-gray-800 text-sm">{{ form.total_nilai }}</strong></div>
                            <div class="text-xs text-gray-500">Grade: <strong class="text-white bg-indigo-600 px-2 py-0.5 rounded text-sm ml-1">{{ form.nilai_huruf }}</strong></div>
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3">
                        <button type="button" @click="tutupModal" class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition">Batal</button>
                        <button type="submit" class="px-6 py-2 bg-indigo-600 text-white rounded text-sm font-bold hover:bg-indigo-700 shadow-md transition">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style>
.print-header { display: block !important; }
</style>