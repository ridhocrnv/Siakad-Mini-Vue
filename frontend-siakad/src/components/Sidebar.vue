<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router'; // Kita hanya butuh useRoute untuk info user/path
import { confirmDialog } from '../utils/swal';

const props = defineProps({
    isOpen: Boolean,
    user: Object
});

const route = useRoute(); // Untuk akses route saat ini
const emit = defineEmits(['triggerLogout', 'toggle']);

const logout = async () => {
    const yakin = await confirmDialog('Konfirmasi', 'Yakin ingin keluar dari sistem?');
    if (yakin) {
        emit('triggerLogout'); 
    }
};

// Kelas CSS untuk menu Aktif vs Tidak Aktif
const activeClass = "bg-indigo-700 text-white shadow-lg translate-x-1";
const inactiveClass = "text-indigo-100 hover:bg-indigo-800 hover:text-white";
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" @click="$emit('toggle')"></div>

    <aside 
        class="fixed inset-y-0 left-0 z-50 w-64 bg-indigo-900 text-white transform transition-transform duration-300 ease-in-out shadow-xl flex flex-col"
        :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
    >
        <div class="h-16 flex items-center justify-center border-b border-indigo-800 bg-indigo-950 shadow-md">
            <div class="flex items-center gap-3">
                <i class="fas fa-university text-2xl text-yellow-400"></i>
                <h1 class="text-xl font-bold tracking-wide">SIAKAD <span class="text-yellow-400">MINI</span></h1>
            </div>
        </div>

        <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            
            <p class="px-4 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Main Menu</p>

            <router-link 
                to="/" 
                class="w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 group"
                :class="route.path === '/' ? activeClass : inactiveClass"
            >
                <i class="fas fa-home w-6 text-center group-hover:scale-110 transition-transform"></i>
                <span class="ml-3 font-medium text-sm">Dashboard</span>
            </router-link>

            <router-link 
                to="/mahasiswa" 
                class="w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 group"
                :class="route.path.startsWith('/mahasiswa') ? activeClass : inactiveClass"
            >
                <i class="fas fa-user-graduate w-6 text-center group-hover:scale-110 transition-transform"></i>
                <span class="ml-3 font-medium text-sm">Data Mahasiswa</span>
            </router-link>

            <router-link 
                to="/jurusan" 
                class="w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 group"
                :class="route.path.startsWith('/jurusan') ? activeClass : inactiveClass"
            >
                <i class="fas fa-building w-6 text-center group-hover:scale-110 transition-transform"></i>
                <span class="ml-3 font-medium text-sm">Data Jurusan</span>
            </router-link>

            <router-link 
                to="/matakuliah" 
                class="w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 group"
                :class="route.path.startsWith('/matakuliah') ? activeClass : inactiveClass"
            >
                <i class="fas fa-book w-6 text-center group-hover:scale-110 transition-transform"></i>
                <span class="ml-3 font-medium text-sm">Data Matakuliah</span>
            </router-link>

            <p class="px-4 text-xs font-semibold text-indigo-400 uppercase tracking-wider mt-6 mb-2">Akademik</p>

            <router-link 
                to="/krs" 
                class="w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 group"
                :class="route.path.startsWith('/krs') ? activeClass : inactiveClass"
            >
                <i class="fas fa-edit w-6 text-center group-hover:scale-110 transition-transform"></i>
                <span class="ml-3 font-medium text-sm">Input Nilai / KRS</span>
            </router-link>

        </nav>

        <div class="p-4 border-t border-indigo-800 bg-indigo-950">
            <div class="flex items-center gap-3 mb-3 px-2">
                <div class="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow">
                    {{ user?.username?.charAt(0).toUpperCase() || 'A' }}
                </div>
                <div class="overflow-hidden">
                    <p class="text-xs font-bold text-white truncate">{{ user?.nama_lengkap || 'Administrator' }}</p>
                    <p class="text-[10px] text-indigo-300 truncate capitalize">{{ user?.role || 'Admin' }}</p>
                </div>
            </div>
            
            <button 
                @click="logout"
                class="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-xs font-bold transition-colors shadow-md active:scale-95"
            >
                <i class="fas fa-sign-out-alt"></i> Keluar
            </button>
        </div>
    </aside>
</template>