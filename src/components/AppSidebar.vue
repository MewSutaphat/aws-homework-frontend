<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const { logout } = useAuth()
const router = useRouter()
const isGuest = !!sessionStorage.getItem('guest')

function backToLogin() {
  sessionStorage.removeItem('guest')
  router.replace('/login')
}

const navItems = [
  { label: 'Create Note', path: '/create' },
  { label: 'Delete Note', path: '/delete' },
  { label: 'Edit Note', path: '/edit' },
  { label: 'Show All Notes', path: '/show' },
]
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-title">Notes Manager</div>
    <nav>
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-btn"
        active-class="active"
      >
        {{ item.label }}
      </RouterLink>
    </nav>
    <div class="sidebar-footer">
      <button v-if="!isGuest" class="logout-btn" @click="logout">Logout</button>
      <button v-else class="back-btn" @click="backToLogin">Back to Login</button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 220px;
  background-color: #1e293b;
  color: #f1f5f9;
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  flex-shrink: 0;
  min-height: 100vh;
}

.sidebar-title {
  font-size: 1.1rem;
  font-weight: 700;
  padding: 0 24px 20px;
  border-bottom: 1px solid #334155;
  margin-bottom: 16px;
  color: #e2e8f0;
}

.nav-btn {
  display: block;
  width: 100%;
  padding: 12px 24px;
  background: none;
  border: none;
  color: #94a3b8;
  text-align: left;
  font-size: 0.95rem;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
  box-sizing: border-box;
}

.nav-btn:hover {
  background-color: #334155;
  color: #f1f5f9;
}

.nav-btn.active {
  background-color: #3b82f6;
  color: #ffffff;
  font-weight: 600;
}

.sidebar-footer {
  margin-top: auto;
  padding: 16px 16px 8px;
}

.logout-btn {
  display: block;
  width: 100%;
  padding: 10px 24px;
  background: none;
  border: 1px solid #475569;
  border-radius: 6px;
  color: #94a3b8;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  transition: background 0.15s, color 0.15s;
}

.logout-btn:hover {
  background-color: #ef4444;
  border-color: #ef4444;
  color: #ffffff;
}

.back-btn {
  display: block;
  width: 100%;
  padding: 10px 24px;
  background: none;
  border: 1px solid #475569;
  border-radius: 6px;
  color: #94a3b8;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  transition: background 0.15s, color 0.15s;
}

.back-btn:hover {
  background-color: #334155;
  color: #f1f5f9;
}
</style>
