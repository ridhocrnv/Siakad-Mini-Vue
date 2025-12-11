<script setup>
import { ref, onMounted, reactive, computed, watch } from 'vue'; // Tambah 'watch'
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { showToast, confirmDialog, showAlert } from '../utils/swal';

const listKrs = ref([]);
const listMahasiswa = ref([]);
const listMatakuliah = ref([]);
const isLoading = ref(true);
const showModal = ref(false);
const isSubmitting = ref(false);
const editId = ref(null);

// FILTER
const selectedMahasiswaId = ref('');
const selectedSemesterFilter = ref('');

const form = reactive({
    id_mahasiswa: '',
    id_matakuliah: '',
    semester: '20242',
    // KOMPONEN NILAI BARU
    nilai_tugas: 0,
    nilai_uts: 0,
    nilai_uas: 0,
    total_nilai: 0, // Skala 0-100
    nilai_angka: 0, // Bobot 4.0 (Otomatis)
    nilai_huruf: 'E' // Grade (Otomatis)
});

// --- RUMUS OTOMATIS (THE MAGIC) ---
// Kita pantau perubahan pada Tugas, UTS, UAS
watch(
    () => [form.nilai_tugas, form.nilai_uts, form.nilai_uas],
    ([tugas, uts, uas]) => {
        // 1. Hitung Total Nilai (Bobot: Tugas 30%, UTS 35%, UAS 35%)
        const total = (Number(tugas) * 0.3) + (Number(uts) * 0.35) + (Number(uas) * 0.35);
        form.total_nilai = total.toFixed(2);

        // 2. Tentukan Grade & Bobot IPK
        if (total >= 80) { form.nilai_huruf = 'A'; form.nilai_angka = 4.0; }
        else if (total >= 75) { form.nilai_huruf = 'B+'; form.nilai_angka = 3.5; }
        else if (total >= 70) { form.nilai_huruf = 'B'; form.nilai_angka = 3.0; }
        else if (total >= 60) { form.nilai_huruf = 'C+'; form.nilai_angka = 2.5; }
        else if (total >= 50) { form.nilai_huruf = 'C'; form.nilai_angka = 2.0; }
        else if (total >= 40) { form.nilai_huruf = 'D'; form.nilai_angka = 1.0; }
        else { form.nilai_huruf = 'E'; form.nilai_angka = 0.0; }
    }
);

// --- COMPUTED ---
const availableSemesters = computed(() => {
    if (!selectedMahasiswaId.value) return [];
    const studentKrs = listKrs.value.filter(k => k.id_mahasiswa == selectedMahasiswaId.value);
    const sems = studentKrs.map(k => k.semester);
    return [...new Set(sems)].sort((a,b) => b - a);
});

const filteredKrs = computed(() => {
    return listKrs.value.filter(item => {
        const matchMhs = !selectedMahasiswaId.value || item.id_mahasiswa == selectedMahasiswaId.value;
        const matchSem = !selectedSemesterFilter.value || item.semester == selectedSemesterFilter.value;
        return matchMhs && matchSem;
    });
});

const activeStudent = computed(() => listMahasiswa.value.find(m => m.id == selectedMahasiswaId.value));
const activeStudentDetails = computed(() => {
    if (filteredKrs.value.length > 0) return filteredKrs.value[0];
    if (selectedMahasiswaId.value) return listKrs.value.find(k => k.id_mahasiswa == selectedMahasiswaId.value);
    return null;
});

// Hitung IPK/IPS pakai 'nilai_angka' (Bobot 4.0)
const hitungIPS = computed(() => {
    if (!selectedMahasiswaId.value || !selectedSemesterFilter.value) return "0.00";
    let totalSks = 0, totalMutu = 0;
    filteredKrs.value.forEach(krs => {
        const sks = Number(krs.sks || 0);
        const bobot = Number(krs.nilai_angka || 0); // Pakai Bobot 4.0
        totalSks += sks;
        totalMutu += (sks * bobot);
    });
    return totalSks === 0 ? "0.00" : (totalMutu / totalSks).toFixed(2);
});

const hitungIPK = computed(() => {
    if (!selectedMahasiswaId.value) return "0.00";
    const allKrsMhs = listKrs.value.filter(k => k.id_mahasiswa == selectedMahasiswaId.value);
    let totalSks = 0, totalMutu = 0;
    allKrsMhs.forEach(krs => {
        const sks = Number(krs.sks || 0);
        const bobot = Number(krs.nilai_angka || 0);
        totalSks += sks;
        totalMutu += (sks * bobot);
    });
    return totalSks === 0 ? "0.00" : (totalMutu / totalSks).toFixed(2);
});

// --- ACTIONS ---
const fetchKrs = async () => {
    try {
        const response = await axios.get('http://localhost:3000/api/krs');
        if(response.data.success) listKrs.value = response.data.data;
    } catch (e) { console.error(e); }
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
            showToast('Nilai Updated!');
        } else {
            await axios.post('http://localhost:3000/api/krs', form);
            showToast('Nilai Tersimpan!');
        }
        tutupModal();
        fetchKrs();
    } catch (error) { showAlert('Error', 'Gagal simpan data', 'error'); } 
    finally { isSubmitting.value = false; }
};

const hapusData = async (id) => {
    const yakin = await confirmDialog('Hapus KRS?', 'Data akan hilang.');
    if(yakin) {
        try {
            await axios.delete(`http://localhost:3000/api/krs/${id}`);
            showToast('Terhapus!');
            fetchKrs();
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

// --- MODAL ---
const bukaModalTambah = () => {
    editId.value = null;
    form.id_mahasiswa = selectedMahasiswaId.value || ''; 
    form.id_matakuliah = ''; form.semester = selectedSemesterFilter.value || '20242';
    // Reset Nilai
    form.nilai_tugas = 0; form.nilai_uts = 0; form.nilai_uas = 0;
    form.total_nilai = 0; form.nilai_angka = 0; form.nilai_huruf = 'E';
    showModal.value = true;
};

const bukaModalEdit = (item) => {
    editId.value = item.id;
    form.id_mahasiswa = item.id_mahasiswa; form.id_matakuliah = item.id_matakuliah;
    form.semester = item.semester; 
    // Load Nilai Lama
    form.nilai_tugas = item.nilai_tugas || 0;
    form.nilai_uts = item.nilai_uts || 0;
    form.nilai_uas = item.nilai_uas || 0;
    // Pemicu watch agar hitung ulang (total & grade)
    form.total_nilai = item.total_nilai || 0;
    form.nilai_angka = item.nilai_angka || 0;
    form.nilai_huruf = item.nilai_huruf || 'E';
    
    showModal.value = true;
};
const tutupModal = () => { showModal.value = false; };

onMounted(() => { fetchKrs(); fetchMahasiswa(); fetchMatakuliah(); });
</script>

<template>
    <div>
        <div class="bg-white p-6 rounded-lg shadow-md">
            
            <div class="flex flex-col md:flex-row justify-between mb-6 gap-4 border-b pb-4">
                <div class="flex flex-col md:flex-row gap-4 w-full md:w-2/3">
                    <div class="w-full md:w-1/2">
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Pilih Mahasiswa</label>
                        <select v-model="selectedMahasiswaId" @change="selectedSemesterFilter = ''" class="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-indigo-500 bg-white">
                            <option value="">-- Cari Mahasiswa --</option>
                            <option v-for="mhs in listMahasiswa" :key="mhs.id" :value="mhs.id">{{ mhs.nim }} - {{ mhs.nama_lengkap }}</option>
                        </select>
                    </div>
                    <div class="w-full md:w-1/2" v-if="selectedMahasiswaId">
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Filter Semester</label>
                        <select v-model="selectedSemesterFilter" class="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-indigo-500 bg-white">
                            <option value="">-- Transkrip Nilai (Semua) --</option>
                            <option v-for="sem in availableSemesters" :key="sem" :value="sem">Semester {{ sem }}</option>
                        </select>
                    </div>
                </div>
                <div class="flex gap-2 items-end">
                    <button v-if="selectedMahasiswaId && filteredKrs.length > 0" @click="cetakPdf" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md shadow"><i class="fas fa-print"></i> PDF</button>
                    <button @click="bukaModalTambah" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md shadow"><i class="fas fa-plus"></i> Input Nilai</button>
                </div>
            </div>

            <div v-if="selectedMahasiswaId" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                    <p class="text-xs text-indigo-500 font-bold uppercase">IPS</p>
                    <p class="text-2xl font-extrabold text-indigo-700">{{ hitungIPS }}</p>
                </div>
                <div class="bg-green-50 p-4 rounded-lg border border-green-100">
                    <p class="text-xs text-green-500 font-bold uppercase">IPK</p>
                    <p class="text-2xl font-extrabold text-green-700">{{ hitungIPK }}</p>
                </div>
            </div>

            <div id="area-cetak" class="bg-white p-2">
                <div v-if="selectedMahasiswaId" class="mb-6 border-b-2 border-black pb-4">
                    <div class="text-center">
                        <h1 class="text-xl font-bold uppercase">Universitas Halu Oleo</h1>
                        <h2 class="text-lg font-semibold">{{ selectedSemesterFilter ? 'Kartu Hasil Studi (KHS)' : 'Transkrip Akademik' }}</h2>
                    </div>
                    <div class="mt-4 text-sm grid grid-cols-2 gap-x-8">
                        <div>
                            <p><span class="w-24 inline-block font-bold">NIM</span>: {{ activeStudent.nim }}</p>
                            <p><span class="w-24 inline-block font-bold">Nama</span>: {{ activeStudent.nama_lengkap }}</p>
                        </div>
                        <div>
                            <p><span class="w-24 inline-block font-bold">Jurusan</span>: {{ activeStudentDetails?.nama_jurusan || '-' }}</p>
                            <p><span class="w-24 inline-block font-bold">Fakultas</span>: {{ activeStudentDetails?.fakultas || '-' }}</p>
                        </div>
                    </div>
                </div>

                <div class="overflow-x-auto">
                    <table class="min-w-full border-collapse border border-gray-400 text-sm">
                        <thead class="bg-gray-100">
                            <tr>
                                <th class="border border-gray-400 px-2 py-2 w-10">No</th>
                                <th class="border border-gray-400 px-2 py-2 w-16">Smt</th>
                                <th class="border border-gray-400 px-2 py-2">Matakuliah</th>
                                <th class="border border-gray-400 px-2 py-2 w-16 text-center">SKS</th>
                                <th class="border border-gray-400 px-2 py-2 w-16 text-center">Tugas</th>
                                <th class="border border-gray-400 px-2 py-2 w-16 text-center">UTS</th>
                                <th class="border border-gray-400 px-2 py-2 w-16 text-center">UAS</th>
                                <th class="border border-gray-400 px-2 py-2 w-16 text-center bg-gray-50">Total</th>
                                <th class="border border-gray-400 px-2 py-2 w-16 text-center font-bold bg-yellow-50">Huruf</th>
                                <th class="border border-gray-400 px-2 py-2 w-20 text-center" data-html2canvas-ignore="true">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="filteredKrs.length === 0"><td colspan="10" class="text-center p-4 text-gray-500 border border-gray-400">Belum ada data nilai.</td></tr>
                            
                            <tr v-for="(item, index) in filteredKrs" :key="item.id">
                                <td class="border border-gray-400 px-2 py-2 text-center">{{ index + 1 }}</td>
                                <td class="border border-gray-400 px-2 py-2 text-center">{{ item.semester }}</td>
                                <td class="border border-gray-400 px-2 py-2">
                                    <span class="font-bold block">{{ item.kode_mk }}</span>
                                    {{ item.nama_mk }}
                                </td>
                                <td class="border border-gray-400 px-2 py-2 text-center">{{ item.sks }}</td>
                                <td class="border border-gray-400 px-2 py-2 text-center text-gray-500">{{ item.nilai_tugas }}</td>
                                <td class="border border-gray-400 px-2 py-2 text-center text-gray-500">{{ item.nilai_uts }}</td>
                                <td class="border border-gray-400 px-2 py-2 text-center text-gray-500">{{ item.nilai_uas }}</td>
                                <td class="border border-gray-400 px-2 py-2 text-center font-bold bg-gray-50">{{ item.total_nilai }}</td>
                                <td class="border border-gray-400 px-2 py-2 text-center font-extrabold bg-yellow-50">{{ item.nilai_huruf }}</td>
                                <td class="border border-gray-400 px-2 py-2 text-center" data-html2canvas-ignore="true">
                                    <button @click="bukaModalEdit(item)" class="text-indigo-600 mr-2"><i class="fas fa-edit"></i></button>
                                    <button @click="hapusData(item.id)" class="text-red-600"><i class="fas fa-trash-alt"></i></button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div v-if="showModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
                <h2 class="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Input Komponen Nilai</h2>
                <form @submit.prevent="simpanData">
                    
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="col-span-2">
                            <label class="block text-xs font-bold text-gray-500 uppercase">Mahasiswa</label>
                            <select v-model="form.id_mahasiswa" class="border rounded w-full py-2 px-3 bg-gray-50" required :disabled="editId">
                                <option value="">Pilih Mahasiswa</option>
                                <option v-for="mhs in listMahasiswa" :key="mhs.id" :value="mhs.id">{{ mhs.nim }} - {{ mhs.nama_lengkap }}</option>
                            </select>
                        </div>
                        <div class="col-span-2">
                            <label class="block text-xs font-bold text-gray-500 uppercase">Matakuliah</label>
                            <select v-model="form.id_matakuliah" class="border rounded w-full py-2 px-3" required>
                                <option value="">Pilih MK</option>
                                <option v-for="mk in listMatakuliah" :key="mk.id" :value="mk.id">[Smt {{ mk.semester }}] {{ mk.nama_mk }} ({{ mk.sks }} SKS)</option>
                            </select>
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="block text-xs font-bold text-gray-500 uppercase">Semester</label>
                        <input v-model="form.semester" type="text" class="border rounded w-full py-2 px-3" placeholder="20242">
                    </div>

                    <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                        <h3 class="text-sm font-bold text-gray-700 mb-3 border-b pb-1">Rincian Nilai (0-100)</h3>
                        <div class="grid grid-cols-3 gap-3">
                            <div>
                                <label class="block text-xs text-gray-500">Tugas (30%)</label>
                                <input v-model="form.nilai_tugas" type="number" min="0" max="100" class="border rounded w-full py-1 px-2 text-center focus:ring-2 focus:ring-indigo-500">
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500">UTS (35%)</label>
                                <input v-model="form.nilai_uts" type="number" min="0" max="100" class="border rounded w-full py-1 px-2 text-center focus:ring-2 focus:ring-indigo-500">
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500">UAS (35%)</label>
                                <input v-model="form.nilai_uas" type="number" min="0" max="100" class="border rounded w-full py-1 px-2 text-center focus:ring-2 focus:ring-indigo-500">
                            </div>
                        </div>
                        
                        <div class="mt-4 flex justify-between items-center bg-white p-2 rounded border">
                            <div>
                                <p class="text-xs text-gray-500">Total Nilai</p>
                                <p class="text-lg font-bold">{{ form.total_nilai }}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-xs text-gray-500">Grade / Bobot</p>
                                <p class="text-lg font-bold text-indigo-600">{{ form.nilai_huruf }} / {{ form.nilai_angka }}</p>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end space-x-2">
                        <button type="button" @click="tutupModal" class="px-4 py-2 bg-gray-200 rounded">Batal</button>
                        <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded font-bold">Simpan Nilai</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>