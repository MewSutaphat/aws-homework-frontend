<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const { login, signup, confirmCode } = useAuth()
const router = useRouter()

function continueAsGuest() {
  sessionStorage.setItem('guest', 'true')
  router.replace('/create')
}

type Mode = 'login' | 'signup' | 'confirm'
const mode = ref<Mode>('login')

const name = ref('')
const password = ref('')
const email = ref('')
const group = ref('developers')
const code = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const loading = ref(false)

const groups = ['developers', 'leaders', 'admins']

async function handleLogin() {
  errorMessage.value = ''
  loading.value = true
  try {
    await login(email.value, password.value)
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message ?? error.message
  } finally {
    loading.value = false
  }
}

async function handleSignup() {
  errorMessage.value = ''
  successMessage.value = ''
  loading.value = true
  try {
    await signup(name.value, password.value, email.value, group.value)
    successMessage.value = 'Sign up successful! Please check your email for the confirmation code.'
    mode.value = 'confirm'
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message ?? error.message
  } finally {
    loading.value = false
  }
}

async function handleConfirm() {
  errorMessage.value = ''
  successMessage.value = ''
  loading.value = true
  try {
    await confirmCode(email.value, code.value)
    successMessage.value = 'Account confirmed! You can now log in.'
    mode.value = 'login'
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message ?? error.message
  } finally {
    loading.value = false
  }
}

function switchMode(target: Mode) {
  mode.value = target
  errorMessage.value = ''
  successMessage.value = ''
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="app-title">Notes Manager</h1>

      <!-- Login -->
      <form v-if="mode === 'login'" @submit.prevent="handleLogin">
        <h2 class="form-title">Sign In</h2>
        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="Enter email" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="Enter password" required />
        </div>
        <p v-if="errorMessage" class="msg error">{{ errorMessage }}</p>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
        <div class="links">
          <button type="button" class="link-btn" @click="switchMode('signup')">Create an account</button>
          <span class="divider">·</span>
          <button type="button" class="link-btn" @click="switchMode('confirm')">Confirm account</button>
        </div>
        <div class="links">
          <button type="button" class="link-btn" @click="continueAsGuest">Continue as Guest</button>
        </div>
      </form>

      <!-- Sign Up -->
      <form v-else-if="mode === 'signup'" @submit.prevent="handleSignup">
        <h2 class="form-title">Create Account</h2>
        <div class="form-group">
          <label>Name</label>
          <input v-model="name" type="text" placeholder="Enter your name" required />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="Enter email" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="Enter password" required />
        </div>
        <div class="form-group">
          <label>Group</label>
          <select v-model="group">
            <option v-for="g in groups" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>
        <p v-if="errorMessage" class="msg error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="msg success">{{ successMessage }}</p>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Creating...' : 'Sign Up' }}
        </button>
        <div class="links">
          <button type="button" class="link-btn" @click="switchMode('login')">Back to Sign In</button>
        </div>
      </form>

      <!-- Confirm Code -->
      <form v-else-if="mode === 'confirm'" @submit.prevent="handleConfirm">
        <h2 class="form-title">Confirm Account</h2>
        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="Enter email" required />
        </div>
        <div class="form-group">
          <label>Confirmation Code</label>
          <input v-model="code" type="text" placeholder="Enter code from email" required />
        </div>
        <p v-if="errorMessage" class="msg error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="msg success">{{ successMessage }}</p>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Confirming...' : 'Confirm' }}
        </button>
        <div class="links">
          <button type="button" class="link-btn" @click="switchMode('login')">Back to Sign In</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background-color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 48px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
}

.app-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
  text-align: center;
  margin-bottom: 32px;
}

.form-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #1e293b;
  background: #ffffff;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.form-group select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #1e293b;
  background: #ffffff;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
  cursor: pointer;
}

.btn {
  width: 100%;
  padding: 11px;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.15s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #3b82f6;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.link-btn {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

.link-btn:hover {
  color: #2563eb;
}

.divider {
  color: #94a3b8;
  font-size: 0.875rem;
}

.msg {
  font-size: 0.875rem;
  margin-bottom: 8px;
  padding: 8px 12px;
  border-radius: 6px;
}

.msg.error {
  color: #dc2626;
  background-color: #fef2f2;
}

.msg.success {
  color: #16a34a;
  background-color: #f0fdf4;
}

.guest-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  text-align: center;
}
</style>
