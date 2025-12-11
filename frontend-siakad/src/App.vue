<script setup>
import { ref, onMounted } from 'vue';
import Login from './components/Login.vue';
import Sidebar from './components/Sidebar.vue';
import Home from './components/Home.vue';
import TableMahasiswa from './components/TableMahasiswa.vue';
import TableJurusan from './components/TableJurusan.vue';
import TableMatakuliah from './components/TableMatakuliah.vue';
import TableKrs from './components/TableKrs.vue';

// --- STATE AUTH ---
const isAuthenticated = ref(false);
const currentUser = ref(null); // <--- 1. STATE BARU: Data User

const checkAuth = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user'); // Ambil string JSON user

    if (token && userStr) {
        isAuthenticated.value = true;
        // 2. Parse JSON string jadi Objek agar bisa dipakai
        currentUser.value = JSON.parse(userStr); 
    }
};

const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    isAuthenticated.value = false;
    currentUser.value = null; // Reset user
    activeTab.value = 'home';
};

// ... State dashboard & sidebar tetap sama ...
const activeTab = ref('home');
const isSidebarOpen = ref(true);
const toggleSidebar = () => { isSidebarOpen.value = !isSidebarOpen.value; };
const handleTabChange = (tabId) => {
    activeTab.value = tabId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.innerWidth < 768) isSidebarOpen.value = false; 
};

onMounted(() => {
    checkAuth();
});
</script>

<template>
  <div v-if="!isAuthenticated">
      <Login @loginSuccess="checkAuth" />
  </div>

  <div v-else class="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
    
    <Sidebar 
        :activeTab="activeTab" 
        :isOpen="isSidebarOpen" 
        :user="currentUser"  
        @changeTab="handleTabChange" 
        @triggerLogout="handleLogout"
    />

    <div class="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out" :class="isSidebarOpen ? 'md:ml-64' : 'ml-0'">
      
      <header class="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
        <div class="flex items-center">
            <button @click="toggleSidebar" class="text-gray-600 hover:text-indigo-600 focus:outline-none mr-4">
                <i class="fas fa-bars text-xl"></i>
            </button>
            <h1 class="text-xl font-bold text-gray-800 capitalize hidden sm:block">
              {{ activeTab === 'krs' ? 'Kartu Rencana Studi' : activeTab.replace('_', ' ') }}
            </h1>
        </div>
        
        <div class="flex items-center space-x-4">
           <div class="flex items-center gap-2">
               <div class="text-right hidden sm:block">
                   <p class="text-sm font-bold text-gray-700">
                       {{ currentUser?.nama || 'Admin' }}
                   </p>
                   <p class="text-xs text-green-500">Online</p>
               </div>
               <div class="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                   <i class="fas fa-user"></i>
               </div>
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
        &copy; 2025 SIAKAD Mini. Built with Vue 3.
      </footer>

    </div>
  </div>
</template>