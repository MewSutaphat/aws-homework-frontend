<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{ show: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const router = useRouter()

function goToLogin() {
  sessionStorage.removeItem('guest')
  router.replace('/login')
}
</script>

<template>
  <div v-if="show" class="dialog-overlay" @click.self="emit('close')">
    <div class="dialog">
      <p>Please login to use this feature.</p>
      <div class="dialog-actions">
        <button class="dialog-btn btn-login" @click="goToLogin">Go to Login</button>
        <button class="dialog-btn btn-close" @click="emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>

<style>
@import '../assets/dialog.css';
</style>

<style scoped>
.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.dialog-btn {
  padding: 10px 28px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-login {
  background-color: #3b82f6;
  color: #ffffff;
}

.btn-login:hover {
  background-color: #2563eb;
}

.btn-close {
  background-color: #e2e8f0;
  color: #475569;
}

.btn-close:hover {
  background-color: #cbd5e1;
}
</style>
