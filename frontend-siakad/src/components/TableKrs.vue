<script setup>
import { ref, onMounted, reactive, computed, nextTick } from 'vue';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { showToast, confirmDialog, showAlert } from '../utils/swal';

// --- STATE ---
const listKrs = ref([]);
const listMahasiswa = ref([]);
const listMatakuliah = ref([]);
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
// 1. FILTER MAHASISWA & SELECT (ANTI DUPLIKAT & ANTI MACET)
// ==========================================
const filteredStudentList = computed(() => {
    if (!listMahasiswa.value) return [];

    // 1. DEDUPLIKASI: Hapus data ganda berdasarkan NIM
    const uniqueMap = new Map();
    listMahasiswa.value.forEach(mhs => {
        const key = mhs.nim ? mhs.nim : `ID-${mhs.id}`;
        if (!uniqueMap.has(key)) uniqueMap.set(key, mhs);
    });
    let data = Array.from(uniqueMap.values());

    // 2. SORTING NAMA
    data.sort((a, b) => (a.nama_lengkap || '').localeCompare(b.nama_lengkap || ''));

    // 3. SEARCH
    if (searchStudentQuery.value) {
        const keyword = searchStudentQuery.value.toLowerCase().trim();
        data = data.filter(m =>
            (m.nama_lengkap && m.nama_lengkap.toLowerCase().includes(keyword)) ||
            (m.nim && String(m.nim).toLowerCase().includes(keyword))
        );
    }
    return data;
});

// FUNGSI SELECT (SOLUSI ANTI MACET)
const selectStudent = async (id) => {
    try {
        const safeId = Number(id);

        // Reset state UI dulu (Memaksa komponen kanan unmount sebentar)
        selectedMahasiswaId.value = null;
        selectedSemesterFilter.value = '';

        // Tunggu Vue render ulang
        await nextTick();

        // Set ID baru (Mount ulang komponen kanan dengan data fresh)
        selectedMahasiswaId.value = safeId;
    } catch (e) {
        console.error("Gagal pilih mahasiswa:", e);
    }
};

// ==========================================
// 2. DETAIL DATA
// ==========================================
const activeStudent = computed(() => {
    if (!selectedMahasiswaId.value) return null;
    return listMahasiswa.value.find(m => m.id === selectedMahasiswaId.value) || null;
});

const studentKrsData = computed(() => {
    if (!selectedMahasiswaId.value) return [];
    if (!listKrs.value) return [];
    return listKrs.value.filter(k => k.id_mahasiswa == selectedMahasiswaId.value);
});

const displayedKrs = computed(() => {
    let data = studentKrsData.value;
    if (selectedSemesterFilter.value) {
        data = data.filter(k => k.semester == selectedSemesterFilter.value);
    }
    return data;
});

const availableSemesters = computed(() => {
    if (!studentKrsData.value || studentKrsData.value.length === 0) return [];
    const sems = studentKrsData.value.map(k => k.semester);
    return [...new Set(sems)].sort((a, b) => b - a);
});

// ==========================================
// 3. LOGIC NILAI (PEMBULATAN & GRADE A-E)
// ==========================================
const calculateGPA = (dataSet) => {
    if (!dataSet || dataSet.length === 0) return "0.00";
    let totalSks = 0;
    let totalMutu = 0;

    dataSet.forEach(k => {
        const sks = parseFloat(k.sks) || 0;
        const bobot = parseFloat(k.nilai_angka) || 0;
        totalSks += sks;
        totalMutu += (sks * bobot);
    });

    if (totalSks === 0) return "0.00";
    return (totalMutu / totalSks).toFixed(2);
};

const hitungIPS = computed(() => calculateGPA(displayedKrs.value));
const hitungIPK = computed(() => calculateGPA(studentKrsData.value));

// RUMUS PERHITUNGAN OTOMATIS (Trigger by @input)
const hitungNilaiOtomatis = () => {
    const tugas = parseFloat(form.nilai_tugas) || 0;
    const prak = parseFloat(form.nilai_praktikum) || 0;
    const uts = parseFloat(form.nilai_uts) || 0;
    const uas = parseFloat(form.nilai_uas) || 0;

    let total = 0;

    // 1. Hitung Nilai Mentah
    if (form.has_praktikum) {
        total = (tugas * 0.20) + (prak * 0.20) + (uts * 0.30) + (uas * 0.30);
    } else {
        total = (tugas * 0.30) + (uts * 0.35) + (uas * 0.35);
    }

    // 2. PEMBULATAN (Rounding)
    const totalBulat = Math.round(total);
    form.total_nilai = parseFloat(totalBulat).toFixed(2);

    // 3. KONVERSI GRADE (A, B, C, D, E)
    if (totalBulat >= 80) { form.nilai_huruf = 'A'; form.nilai_angka = 4.0; }
    else if (totalBulat >= 70) { form.nilai_huruf = 'B'; form.nilai_angka = 3.0; }
    else if (totalBulat >= 60) { form.nilai_huruf = 'C'; form.nilai_angka = 2.0; }
    else if (totalBulat >= 50) { form.nilai_huruf = 'D'; form.nilai_angka = 1.0; }
    else { form.nilai_huruf = 'E'; form.nilai_angka = 0.0; }
};

// ==========================================
// 4. API ACTIONS
// ==========================================
const fetchAllData = async () => {
    isLoading.value = true;
    try {
        const [krsRes, mhsRes, mkRes] = await Promise.all([
            axios.get('http://localhost:3000/api/krs'),
            axios.get('http://localhost:3000/api/mahasiswa'),
            axios.get('http://localhost:3000/api/matakuliah')
        ]);
        listKrs.value = krsRes.data.data || [];
        listMahasiswa.value = mhsRes.data.data || [];
        listMatakuliah.value = mkRes.data.data || [];
    } catch (e) {
        showToast('Gagal memuat data', 'error');
    } finally { isLoading.value = false; }
};

const simpanData = async () => {
    try {
        isSubmitting.value = true;
        if (!form.has_praktikum) form.nilai_praktikum = 0;
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
    if (yakin) {
        try {
            await axios.delete(`http://localhost:3000/api/krs/${id}`);
            showToast('Terhapus!');
            fetchAllData();
        } catch (e) { showAlert('Error', 'Gagal hapus', 'error'); }
    }
};

// ==========================================
// ==========================================
// 5. CETAK PDF (DETAIL NILAI & CLEAN LAYOUT)
// ==========================================
const cetakPdf = async (tipe) => {
    if (!activeStudent.value) return showAlert('Error', 'Pilih mahasiswa dulu!', 'error');

    let dataToPrint = [];
    let judulDokumen = "";
    let labelNilai = "";
    let nilaiAkhir = "";
    let semesterDisplay = "";

    const formatSemester = (kodeSem) => {
        if (!kodeSem) return "Semua Semester";
        const tahun = kodeSem.substring(0, 4);
        const tipe = kodeSem.slice(-1) === '1' ? 'Ganjil' : 'Genap';
        return `${tipe} ${tahun}/${parseInt(tahun) + 1}`;
    };

    if (tipe === 'khs') {
        if (!selectedSemesterFilter.value) {
            return showAlert('Pilih Semester', 'Pilih semester dulu untuk mencetak KHS.', 'warning');
        }
        dataToPrint = displayedKrs.value;
        judulDokumen = "KARTU HASIL STUDI (KHS)";
        labelNilai = "IP Semester"; // Label pendek sesuai request
        nilaiAkhir = hitungIPS.value;
        semesterDisplay = formatSemester(selectedSemesterFilter.value);
    } else {
        if (studentKrsData.value.length === 0) return showAlert('Kosong', 'Belum ada data nilai.', 'warning');
        dataToPrint = studentKrsData.value;
        judulDokumen = "TRANSKRIP NILAI AKADEMIK";
        labelNilai = "IP Kumulatif"; // Label pendek sesuai request
        nilaiAkhir = hitungIPK.value;
        semesterDisplay = "Semua Semester";
    }

    isSubmitting.value = true;

    try {
        const colorHeaderBg = "#e0f7fa"; 
        const colorHeaderText = "#000000"; 
        const colorText = "#000";   

        // 1. Susun Baris Tabel (9 Kolom)
        const tableRows = dataToPrint.map((item, index) => `
            <tr>
                <td style="padding: 6px 2px; text-align: center; color: ${colorText}; border-bottom: 1px solid #ccc;">${index + 1}</td>
                <td style="padding: 6px 2px; text-align: left; color: ${colorText}; border-bottom: 1px solid #ccc;">
                    <span style="font-weight: bold;">[${item.kode_mk}]</span> ${item.nama_mk}
                </td>
                <td style="padding: 6px 2px; text-align: center; color: ${colorText}; border-bottom: 1px solid #ccc;">${item.sks}</td>
                <td style="padding: 6px 2px; text-align: center; color: ${colorText}; border-bottom: 1px solid #ccc;">${item.nilai_tugas || 0}</td>
                <td style="padding: 6px 2px; text-align: center; color: ${colorText}; border-bottom: 1px solid #ccc;">${item.nilai_praktikum || 0}</td>
                <td style="padding: 6px 2px; text-align: center; color: ${colorText}; border-bottom: 1px solid #ccc;">${item.nilai_uts || 0}</td>
                <td style="padding: 6px 2px; text-align: center; color: ${colorText}; border-bottom: 1px solid #ccc;">${item.nilai_uas || 0}</td>
                <td style="padding: 6px 2px; text-align: center; font-weight: bold; color: ${colorText}; border-bottom: 1px solid #ccc;">${item.total_nilai}</td>
                <td style="padding: 6px 2px; text-align: center; font-weight: bold; color: ${colorText}; border-bottom: 1px solid #ccc;">${item.nilai_huruf}</td>
            </tr>
        `).join('');

        const totalSksCetak = dataToPrint.reduce((sum, item) => sum + (parseFloat(item.sks) || 0), 0);
        const logoUrl = "./public/logo_uho.png";

        // 2. Layout HTML
        const content = document.createElement('div');
        content.innerHTML = `
            <div style="font-family: 'Times New Roman', serif; color: #000; padding: 25px 40px; width: 750px; font-size: 11pt; line-height: 1.3;">
                
                <div style="border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 15px;">
                    <table style="width: 100%;">
                        <tr>
                            <td style="width: 12%; vertical-align: middle; text-align: center;">
                                <img src="${logoUrl}" style="width: 75px; height: auto;">
                            </td>
                            <td style="width: 88%; text-align: center;">
                                <h4 style="margin: 0; font-size: 12pt; font-weight: normal; text-transform: uppercase;">Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi</h4>
                                <h2 style="margin: 2px 0; font-size: 16pt; font-weight: bold; text-transform: uppercase;">UNIVERSITAS HALU OLEO</h2>
                                <p style="margin: 0; font-size: 10pt;">Kampus Hijau Bumi Tridharma, Anduonohu, Kendari</p>
                                <p style="margin: 0; font-size: 10pt;">Website: uho.ac.id | Email: rektorat@uho.ac.id</p>
                            </td>
                        </tr>
                    </table>
                </div>

                <div style="text-align: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; text-decoration: underline; font-size: 14pt; font-weight: bold; text-transform: uppercase;">${judulDokumen}</h3>
                </div>

                <table style="width: 100%; margin-bottom: 20px; font-size: 11pt; border-collapse: collapse;">
                    <tr>
                        <td style="width: 15%;">Nama</td>
                        <td style="width: 35%; font-weight: bold;">: ${activeStudent.value.nama_lengkap}</td>
                        <td style="width: 25%;">Jurusan/Program Studi</td>
                        <td style="width: 25%; font-weight: bold;">: ${activeStudent.value.nama_jurusan || '-'}</td>
                    </tr>
                    <tr>
                        <td>NIM</td>
                        <td style="font-weight: bold;">: ${activeStudent.value.nim}</td>
                        <td>Semester</td>
                        <td style="font-weight: bold;">: ${tipe === 'khs' ? semesterDisplay : '-'}</td> 
                    </tr>
                </table>

                <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 10px;">
                    <thead>
                        <tr style="background-color: ${colorHeaderBg}; color: ${colorHeaderText}; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc;">
                            <th style="padding: 8px 4px; width: 30px; font-weight: bold;">No</th>
                            <th style="padding: 8px 4px; text-align: left; font-weight: bold;">Mata Kuliah</th>
                            <th style="padding: 8px 4px; width: 35px; font-weight: bold;">SKS</th>
                            <th style="padding: 8px 4px; width: 45px; font-weight: bold;">Tugas</th>
                            <th style="padding: 8px 4px; width: 45px; font-weight: bold;">Prak</th>
                            <th style="padding: 8px 4px; width: 45px; font-weight: bold;">UTS</th>
                            <th style="padding: 8px 4px; width: 45px; font-weight: bold;">UAS</th>
                            <th style="padding: 8px 4px; width: 45px; font-weight: bold;">Total</th>
                            <th style="padding: 8px 4px; width: 40px; font-weight: bold;">Huruf</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                    
                    <tfoot>
                        <tr><td colspan="9" style="border-top: 1px solid #000; padding-bottom: 8px;"></td></tr>
                        
                        <tr>
                            <td colspan="9" style="padding: 4px; text-align: left; font-weight: bold; font-size: 11pt;">
                                Jumlah SKS: ${totalSksCetak}
                            </td>
                        </tr>
                        <tr>
                            <td colspan="9" style="padding: 4px; text-align: left; font-weight: bold; font-size: 11pt;">
                                ${labelNilai}: ${nilaiAkhir}
                            </td>
                        </tr>
                    </tfoot>
                </table>

                <div style="margin-top: 30px; display: flex; justify-content: flex-end;">
                    <div style="text-align: center; width: 250px;">
                        <p style="margin-bottom: 5px;">Kendari, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                        <p style="margin-bottom: 60px;">Mengetahui,<br>Koordinator Program Studi</p>
                        
                        <p style="font-weight: bold; text-decoration: underline; font-size: 11pt;">Dr. Andi Tenriawaru, S.Si., M.Si.</p>
                        <p style="font-size: 11pt;">NIP. 197602082005012001</p>
                    </div>
                </div>
            </div>
        `;

        const opt = {
            margin: [1, 1, 1, 1],
            filename: `${tipe.toUpperCase()}_${activeStudent.value.nim}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true }, 
            jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
        };

        await html2pdf().set(opt).from(content).save();

    } catch (error) {
        console.error(error);
        showToast("Gagal mencetak PDF", "error");
    } finally {
        isSubmitting.value = false;
    }
};

// ==========================================
// 6. MODAL HELPERS
// ==========================================
const bukaModalTambah = () => {
    if (!selectedMahasiswaId.value) return showAlert('Pilih Mahasiswa', 'Silakan pilih mahasiswa dulu', 'warning');
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
                <input v-model="searchStudentQuery" type="text" placeholder="Nama / NIM..."
                    class="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            </div>

            <div class="flex-1 overflow-y-auto p-2 space-y-1">
                <div v-if="isLoading" class="text-center py-4 text-gray-400 text-sm">Loading...</div>

                <button v-for="mhs in filteredStudentList" :key="mhs.id" @click="selectStudent(mhs.id)"
                    class="w-full text-left p-3 rounded-md border transition-all duration-200"
                    :class="selectedMahasiswaId === mhs.id ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-transparent hover:bg-gray-50'">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="font-bold text-sm text-gray-800"
                                :class="selectedMahasiswaId === mhs.id ? 'text-indigo-700' : ''">{{ mhs.nama_lengkap }}
                            </p>
                            <p class="text-[11px] text-gray-500 font-mono">{{ mhs.nim }}</p>
                        </div>
                        <i v-if="selectedMahasiswaId === mhs.id"
                            class="fas fa-chevron-right text-indigo-500 text-xs"></i>
                    </div>
                </button>
            </div>
            <div class="p-2 border-t bg-gray-50 text-center text-[10px] text-gray-400">
                Total {{ filteredStudentList.length }} Mahasiswa
            </div>
        </div>

        <div
            class="w-full md:w-2/3 bg-white rounded-lg shadow-md flex flex-col h-full overflow-hidden border border-gray-200">
            <div v-if="!selectedMahasiswaId"
                class="flex-1 flex flex-col items-center justify-center text-gray-300 bg-gray-50">
                <i class="fas fa-user-graduate text-6xl mb-4 text-gray-200"></i>
                <p>Pilih mahasiswa di sebelah kiri.</p>
            </div>

            <div v-else class="flex flex-col h-full">
                <div class="p-6 border-b bg-white flex justify-between items-start" v-if="activeStudent">
                    <div>
                        <h2 class="text-lg font-bold text-gray-800">{{ activeStudent.nama_lengkap }}</h2>
                        <p class="text-xs text-gray-500">{{ activeStudent.nim }}</p>
                        <p class="text-xs text-gray-600 mt-1 bg-gray-100 px-2 py-0.5 rounded inline-block">
                            {{ activeStudent.nama_jurusan || 'Jurusan -' }}
                        </p>
                    </div>
                    <div class="text-right flex flex-col gap-2 items-end">
                        <div class="flex gap-2 text-xs">
                            <span class="px-2 py-1 bg-green-50 text-green-700 rounded border border-green-100">IPK:
                                <strong>{{ hitungIPK }}</strong></span>
                            <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100">IPS:
                                <strong>{{ hitungIPS }}</strong></span>
                        </div>

                        <div class="flex gap-2 items-center">
                            <select v-model="selectedSemesterFilter"
                                class="border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500 bg-white">
                                <option value="">Semua Smt</option>
                                <option v-for="sem in availableSemesters" :key="sem" :value="sem">Smt {{ sem }}</option>
                            </select>

                            <button @click="bukaModalTambah"
                                class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs shadow transition flex items-center gap-1">
                                <i class="fas fa-plus"></i> Input
                            </button>

                            <div class="relative group inline-block">
                                <button
                                    class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs shadow transition flex items-center gap-1">
                                    <i class="fas fa-print"></i> Cetak <i class="fas fa-caret-down ml-1"></i>
                                </button>

                                <div class="absolute right-0 top-full pt-2 w-40 hidden group-hover:block z-50">
                                    <div class="bg-white border rounded shadow-xl overflow-hidden">
                                        <a @click="cetakPdf('khs')"
                                            class="block px-4 py-2 text-xs text-gray-700 hover:bg-red-50 hover:text-red-600 cursor-pointer border-b transition-colors">
                                            <i class="fas fa-file-alt mr-2"></i>Kartu Hasil Studi
                                        </a>
                                        <a @click="cetakPdf('transkrip')"
                                            class="block px-4 py-2 text-xs text-gray-700 hover:bg-red-50 hover:text-red-600 cursor-pointer transition-colors">
                                            <i class="fas fa-layer-group mr-2"></i>Transkrip Nilai
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto" id="area-cetak">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50 sticky top-0 shadow-sm">
                            <tr>
                                <th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-10">No</th>
                                <th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-12">Smt
                                </th>
                                <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Matakuliah
                                </th>
                                <th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-12">SKS
                                </th>
                                <th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-16">Total
                                </th>
                                <th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-16">Grade
                                </th>
                                <th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase w-20"
                                    data-html2canvas-ignore="true">Aksi</th>
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
                                <td class="px-4 py-3 text-center text-xs font-mono text-gray-500">{{ item.semester }}
                                </td>
                                <td class="px-4 py-3 text-sm">
                                    <div class="font-medium text-gray-900">{{ item.nama_mk }}</div>
                                    <div class="text-[10px] text-gray-400">{{ item.kode_mk }}</div>
                                </td>
                                <td class="px-4 py-3 text-center text-xs text-gray-500">{{ item.sks }}</td>
                                <td class="px-4 py-3 text-center text-xs font-mono">{{ item.total_nilai }}</td>
                                <td class="px-4 py-3 text-center text-xs font-bold"
                                    :class="item.nilai_huruf === 'A' ? 'text-green-600' : 'text-gray-800'">{{
                                    item.nilai_huruf }}</td>
                                <td class="px-4 py-3 text-center space-x-2" data-html2canvas-ignore="true">
                                    <button @click="bukaModalEdit(item)"
                                        class="text-indigo-600 hover:text-indigo-800 text-xs"><i
                                            class="fas fa-edit"></i></button>
                                    <button @click="hapusData(item.id)"
                                        class="text-red-600 hover:text-red-800 text-xs"><i
                                            class="fas fa-trash-alt"></i></button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div v-if="showModal"
            class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
                <div class="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                    <h2 class="text-lg font-bold text-gray-800">{{ editId ? 'Edit Nilai' : 'Input Nilai Baru' }}</h2>
                    <button @click="tutupModal" class="text-gray-400 hover:text-gray-600"><i
                            class="fas fa-times"></i></button>
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
                            <select v-model="form.id_matakuliah"
                                class="border rounded w-full py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                required>
                                <option value="">Pilih Matakuliah</option>
                                <option v-for="mk in listMatakuliah" :key="mk.id" :value="mk.id">
                                    [Smt {{ mk.semester }}] {{ mk.nama_mk }} ({{ mk.sks }} SKS)
                                </option>
                            </select>
                        </div>
                    </div>
                    <div class="mb-4">
                        <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Semester Akademik</label>
                        <input v-model="form.semester" type="text"
                            class="border rounded w-full py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            required>
                    </div>

                    <div class="bg-gray-50 p-4 rounded border border-gray-200 mb-6">
                        <div class="flex justify-between items-center mb-3">
                            <h3 class="text-xs font-bold text-gray-700">Rincian Nilai</h3>
                            <label class="flex items-center cursor-pointer">
                                <span class="mr-2 text-[10px] font-bold text-indigo-600">Ada Praktikum?</span>
                                <input type="checkbox" v-model="form.has_praktikum" @change="hitungNilaiOtomatis"
                                    class="form-checkbox h-3 w-3 text-indigo-600 rounded">
                            </label>
                        </div>

                        <div class="grid gap-2" :class="form.has_praktikum ? 'grid-cols-4' : 'grid-cols-3'">
                            <div>
                                <label class="block text-[10px] text-gray-500 text-center mb-1">Tugas</label>
                                <input v-model="form.nilai_tugas" @input="hitungNilaiOtomatis" type="number" min="0"
                                    max="100"
                                    class="border rounded w-full py-1 px-1 text-center text-sm font-bold focus:ring-1 focus:ring-indigo-500 outline-none">
                            </div>
                            <div v-if="form.has_praktikum">
                                <label class="block text-[10px] text-gray-500 text-center mb-1">Prak</label>
                                <input v-model="form.nilai_praktikum" @input="hitungNilaiOtomatis" type="number" min="0"
                                    max="100"
                                    class="border rounded w-full py-1 px-1 text-center text-sm font-bold bg-indigo-50 border-indigo-200 focus:ring-1 focus:ring-indigo-500 outline-none">
                            </div>
                            <div>
                                <label class="block text-[10px] text-gray-500 text-center mb-1">UTS</label>
                                <input v-model="form.nilai_uts" @input="hitungNilaiOtomatis" type="number" min="0"
                                    max="100"
                                    class="border rounded w-full py-1 px-1 text-center text-sm font-bold focus:ring-1 focus:ring-indigo-500 outline-none">
                            </div>
                            <div>
                                <label class="block text-[10px] text-gray-500 text-center mb-1">UAS</label>
                                <input v-model="form.nilai_uas" @input="hitungNilaiOtomatis" type="number" min="0"
                                    max="100"
                                    class="border rounded w-full py-1 px-1 text-center text-sm font-bold focus:ring-1 focus:ring-indigo-500 outline-none">
                            </div>
                        </div>

                        <div class="mt-3 pt-3 border-t flex justify-between items-center">
                            <div class="text-xs text-gray-500">Total: <strong class="text-gray-800 text-sm">{{
                                    form.total_nilai }}</strong></div>
                            <div class="flex items-center gap-1">
                                <span class="text-xs text-gray-500">Grade:</span>
                                <select disabled v-model="form.nilai_huruf"
                                    class="border rounded w-12 py-1 px-1 text-center text-sm font-bold bg-gray-100 outline-none text-indigo-700">
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="D">D</option>
                                    <option value="E">E</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3">
                        <button type="button" @click="tutupModal"
                            class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition">Batal</button>
                        <button type="submit"
                            class="px-6 py-2 bg-indigo-600 text-white rounded text-sm font-bold hover:bg-indigo-700 shadow-md transition">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>