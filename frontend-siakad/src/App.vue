<script setup>
import { ref } from 'vue';
import Navbar from './components/Navbar.vue';
import Footer from './components/Footer.vue';
import TableMahasiswa from './components/TableMahasiswa.vue';
import TableMatakuliah from './components/TableMatakuliah.vue';
import TableKrs from './components/TableKrs.vue';
import TableJurusan from './components/TableJurusan.vue';
import Dashboard from './components/Dashboard.vue'; // <--- Import Baru

// Set default tab ke dashboard
const activeTab = ref('dashboard'); 
</script>

<template>
  <div class="flex flex-col min-h-screen bg-gray-100">
    <Navbar />

    <main class="flex-grow container mx-auto p-6">
      
      <div class="flex space-x-4 mb-6 overflow-x-auto pb-2">
        
        <button @click="activeTab = 'dashboard'" :class="['px-4 py-2 rounded-md font-medium transition whitespace-nowrap', activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-50']">
          🏠 Dashboard
        </button>

        <button @click="activeTab = 'mahasiswa'" :class="['px-4 py-2 rounded-md font-medium transition whitespace-nowrap', activeTab === 'mahasiswa' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-50']">
          Data Mahasiswa
        </button>

        <button @click="activeTab = 'jurusan'" :class="['px-4 py-2 rounded-md font-medium transition whitespace-nowrap', activeTab === 'jurusan' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-50']">
          Data Jurusan
        </button>

        <button @click="activeTab = 'matakuliah'" :class="['px-4 py-2 rounded-md font-medium transition whitespace-nowrap', activeTab === 'matakuliah' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-50']">
          Data Matakuliah
        </button>

        <button @click="activeTab = 'krs'" :class="['px-4 py-2 rounded-md font-medium transition whitespace-nowrap', activeTab === 'krs' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-50']">
          Data KRS
        </button>
      </div>

      <div v-if="activeTab === 'dashboard'"> <Dashboard /> </div> <div v-if="activeTab === 'mahasiswa'"> <TableMahasiswa /> </div>
      <div v-if="activeTab === 'jurusan'"> <TableJurusan /> </div>
      <div v-if="activeTab === 'matakuliah'"> <TableMatakuliah /> </div>
      <div v-if="activeTab === 'krs'"> <TableKrs /> </div>

    </main>

    <Footer />
  </div>
</template>