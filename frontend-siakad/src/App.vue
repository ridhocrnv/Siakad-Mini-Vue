<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter, RouterView } from 'vue-router';
import Sidebar from './components/Sidebar.vue';

const route = useRoute();   // Untuk cek kita sedang di halaman apa
const router = useRouter(); // Untuk fungsi redirect (logout)

// --- STATE UI ---
const isSidebarOpen = ref(true);
const currentUser = ref(null);

// --- LOGIC LAYOUT ---
// Cek apakah kita sedang di halaman login?
// Jika 'true', maka Sidebar & Header disembunyikan.
const isLoginPage = computed(() => route.name === 'login');

// Judul Header Otomatis berdasarkan nama Route
const pageTitle = computed(() => {
    switch (route.name) {
        case 'dashboard': return 'Dashboard';
        case 'mahasiswa': return 'Data Mahasiswa';
        case 'jurusan': return 'Data Jurusan';
        case 'matakuliah': return 'Data Matakuliah';
        case 'krs': return 'Kartu Rencana Studi';
        default: return '';
    }
});

// --- AUTH & USER ---
const loadUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            currentUser.value = JSON.parse(userStr);
        } catch (e) {
            console.error("Gagal parse user data");
        }
    }
};

const handleLogout = () => {
    localStorage.clear(); // Hapus Token & User
    currentUser.value = null;
    router.push('/login'); // Tendang ke Login
};

const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value;
};

// Load data user saat aplikasi pertama kali dibuka/refresh
onMounted(() => {
    loadUser();
});
</script>

<template>
  <div v-if="isLoginPage" class="min-h-screen bg-gray-100">
      <RouterView /> 
  </div>

  <div v-else class="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
    
    <Sidebar 
        :activeTab="route.name" 
        :isOpen="isSidebarOpen" 
        :user="currentUser"  
        @triggerLogout="handleLogout"
    />

    <div class="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out" 
         :class="isSidebarOpen ? 'md:ml-64' : 'ml-0'">
      
      <header class="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
        <div class="flex items-center">
            <button @click="toggleSidebar" class="text-gray-600 hover:text-indigo-600 focus:outline-none mr-4">
                <i class="fas fa-bars text-xl"></i>
            </button>
            <h1 class="text-xl font-bold text-gray-800 capitalize hidden sm:block">
              {{ pageTitle }}
            </h1>
        </div>
        
        <div class="flex items-center space-x-4">
           <div class="flex items-center gap-2">
               <div class="text-right hidden sm:block">
                   <p class="text-sm font-bold text-gray-700">
                       {{ currentUser?.nama_lengkap || currentUser?.username || 'Admin' }}
                   </p>
                   <p class="text-xs text-green-500 font-semibold">
                       {{ currentUser?.role || 'User' }} &bull; Online
                   </p>
               </div>
               <div class="h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 border border-indigo-200 shadow-sm">
                   <i class="fas fa-user"></i>
               </div>
           </div>
        </div>
      </header>

      <main class="flex-1 p-4 md:p-8 overflow-y-auto">
        <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
                <component :is="Component" />
            </transition>
        </router-view>
      </main>

       <footer class="bg-white border-t p-4 text-center text-xs text-gray-400">
        &copy; 2025 SIAKAD UHO. Built with Vue 3 & Node.js.
      </footer>

    </div>
  </div>
</template>

<style>
/* Animasi Transisi Halaman */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>