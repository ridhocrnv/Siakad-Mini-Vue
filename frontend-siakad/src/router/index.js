import { createRouter, createWebHistory } from 'vue-router';

// Import dari FOLDER VIEWS (Struktur Professional)
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import MahasiswaView from '../views/MahasiswaView.vue';
import JurusanView from '../views/JurusanView.vue';
import MatakuliahView from '../views/MatakuliahView.vue';
import KrsView from '../views/KrsView.vue';

const routes = [
  { 
    path: '/login', 
    name: 'login', 
    component: LoginView 
  },
  { 
    path: '/', 
    name: 'dashboard', 
    component: DashboardView 
  },
  { 
    path: '/mahasiswa', 
    name: 'mahasiswa', 
    component: MahasiswaView 
  },
  { 
    path: '/jurusan', 
    name: 'jurusan', 
    component: JurusanView 
  },
  { 
    path: '/matakuliah', 
    name: 'matakuliah', 
    component: MatakuliahView 
  },
  { 
    path: '/krs', 
    name: 'krs', 
    component: KrsView 
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// --- SATPAM (GUARD) ---
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('token'); 

  if (to.name !== 'login' && !isAuthenticated) {
    next({ name: 'login' }); 
  } else if (to.name === 'login' && isAuthenticated) {
    next({ name: 'dashboard' }); 
  } else {
    next();
  }
});

export default router;