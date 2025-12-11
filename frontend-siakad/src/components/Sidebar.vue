<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps(['activeTab']);
const emit = defineEmits(['changeTab']);

const menuItems = [
  { id: 'home', label: 'Dashboard', icon: 'fas fa-home' },
  { id: 'mahasiswa', label: 'Data Mahasiswa', icon: 'fas fa-user-graduate' },
  { id: 'jurusan', label: 'Data Jurusan', icon: 'fas fa-university' },
  { id: 'matakuliah', label: 'Data Matakuliah', icon: 'fas fa-book' },
  { id: 'krs', label: 'Input KRS', icon: 'fas fa-file-signature' },
];

const selectTab = (id) => {
  emit('changeTab', id);
};
</script>

<template>
  <aside class="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-50">
    
    <div class="h-16 flex items-center justify-center border-b border-slate-700 bg-slate-950">
      <i class="fas fa-graduation-cap text-indigo-500 text-2xl mr-3"></i>
      <span class="text-xl font-bold tracking-wider">SIAKAD<span class="text-indigo-500">MINI</span></span>
    </div>

    <div class="p-6 flex items-center border-b border-slate-800 bg-slate-900">
      <div class="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">
        A
      </div>
      <div class="ml-3">
        <p class="text-sm font-semibold">Admin Kampus</p>
        <p class="text-xs text-slate-400">Online</p>
      </div>
    </div>

    <nav class="flex-1 overflow-y-auto py-4">
      <ul class="space-y-1">
        <li v-for="item in menuItems" :key="item.id">
          <button 
            @click="selectTab(item.id)"
            :class="[
              'w-full flex items-center px-6 py-3 text-sm font-medium transition-all duration-200 border-l-4',
              activeTab === item.id 
                ? 'bg-slate-800 border-indigo-500 text-indigo-400' 
                : 'border-transparent text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600'
            ]"
          >
            <i :class="[item.icon, 'w-6 text-center text-lg']"></i>
            <span class="ml-3">{{ item.label }}</span>
          </button>
        </li>
      </ul>
    </nav>

    <div class="p-4 border-t border-slate-800">
      <button class="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-slate-800 rounded transition">
        <i class="fas fa-sign-out-alt w-6"></i>
        <span>Logout</span>
      </button>
    </div>
  </aside>
</template>