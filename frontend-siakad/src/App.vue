<script setup>
import { ref } from 'vue';
import Sidebar from './components/Sidebar.vue'; // Sidebar Baru
import Home from './components/Home.vue';       // Home Baru
import TableMahasiswa from './components/TableMahasiswa.vue';
import TableJurusan from './components/TableJurusan.vue';
import TableMatakuliah from './components/TableMatakuliah.vue';
import TableKrs from './components/TableKrs.vue';

const activeTab = ref('home');

const handleTabChange = (tabId) => {
  activeTab.value = tabId;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
</script>

<template>
  <div class="flex h-screen bg-gray-50 font-sans text-gray-900">
    
    <Sidebar :activeTab="activeTab" @changeTab="handleTabChange" />

    <div class="flex-1 flex flex-col ml-64 min-h-screen transition-all duration-300">
      
      <header class="bg-white shadow-sm h-16 flex items-center justify-between px-8 sticky top-0 z-40">
        <h1 class="text-xl font-bold text-gray-800 capitalize">
          {{ activeTab === 'krs' ? 'Kartu Rencana Studi' : activeTab.replace('_', ' ') }}
        </h1>
        
        <div class="flex items-center space-x-4">
           <span class="text-sm text-gray-500">Semester Genap 2024/2025</span>
           <div class="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
             <i class="fas fa-bell"></i>
           </div>
        </div>
      </header>

      <main class="flex-1 p-6 md:p-8 overflow-y-auto">
        <transition name="fade" mode="out-in">
          <div :key="activeTab">
            <Home v-if="activeTab === 'home'" />
            <TableMahasiswa v-if="activeTab === 'mahasiswa'" />
            <TableJurusan v-if="activeTab === 'jurusan'" />
            <TableMatakuliah v-if="activeTab === 'matakuliah'" />
            <TableKrs v-if="activeTab === 'krs'" />
          </div>
        </transition>
      </main>

      <footer class="bg-white border-t p-4 text-center text-xs text-gray-400">
        &copy; {{ new Date().getFullYear() }} SIAKAD Mini UHO. Built with Vue 3 & Tailwind.
      </footer>

    </div>
  </div>
</template>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>