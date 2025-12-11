<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Sidebar from './components/Sidebar.vue';
import Home from './components/Home.vue';
import TableMahasiswa from './components/TableMahasiswa.vue';
import TableJurusan from './components/TableJurusan.vue';
import TableMatakuliah from './components/TableMatakuliah.vue';
import TableKrs from './components/TableKrs.vue';

const activeTab = ref('home');

// --- LOGIKA SIDEBAR ---
// Default: false (Tertutup) sesuai request kamu
// Kalau mau di Desktop otomatis terbuka, ubah jadi: window.innerWidth > 768
const isSidebarOpen = ref(true); 

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

// Opsional: Tutup sidebar otomatis kalau layar dikecilkan (Mobile)
const handleResize = () => {
    if (window.innerWidth < 768) {
        isSidebarOpen.value = false;
    } else {
        isSidebarOpen.value = true;
    }
};

onMounted(() => window.addEventListener('resize', handleResize));
onUnmounted(() => window.removeEventListener('resize', handleResize));


const handleTabChange = (tabId) => {
  activeTab.value = tabId;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Di HP, kalau klik menu, sidebar langsung nutup biar enak
  if (window.innerWidth < 768) {
    isSidebarOpen.value = false;
  }
};
</script>

<template>
  <div class="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
    
    <div 
        v-if="isSidebarOpen" 
        @click="isSidebarOpen = false"
        class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity"
    ></div>

    <Sidebar 
        :activeTab="activeTab" 
        :isOpen="isSidebarOpen" 
        @changeTab="handleTabChange" 
    />

    <div 
        class="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out"
        :class="isSidebarOpen ? 'md:ml-64' : 'ml-0'"
    >
      
      <header class="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
        
        <div class="flex items-center">
            <button 
                @click="toggleSidebar" 
                class="text-gray-600 hover:text-indigo-600 focus:outline-none mr-4 p-2 rounded-md hover:bg-gray-100 transition"
            >
                <i class="fas fa-bars text-xl"></i>
            </button>

            <h1 class="text-xl font-bold text-gray-800 capitalize hidden sm:block">
              {{ activeTab === 'krs' ? 'Kartu Rencana Studi' : activeTab.replace('_', ' ') }}
            </h1>
        </div>
        
        <div class="flex items-center space-x-4">
           <span class="text-sm text-gray-500 hidden md:block">Semester Genap 2024/2025</span>
           <div class="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 cursor-pointer hover:bg-indigo-200 transition">
             <i class="fas fa-bell"></i>
           </div>
        </div>
      </header>

      <main class="flex-1 p-4 md:p-8 overflow-y-auto">
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
        &copy; {{ new Date().getFullYear() }} SIAKAD Mini. Built with Vue 3.
      </footer>

    </div>
  </div>
</template>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>