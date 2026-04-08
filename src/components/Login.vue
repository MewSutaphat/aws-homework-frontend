<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Message from 'primevue/message'
import FloatLabel from 'primevue/floatlabel'

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

const groupOptions = [
  { label: 'Developers', value: 'developers' },
  { label: 'Leaders', value: 'leaders' },
  { label: 'Admins', value: 'admins' },
]

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
  <!-- Full-screen centered layout, mobile-first -->
  <div class="min-h-screen w-full flex items-center justify-center bg-surface-50 p-4 sm:p-8">
    <div class="w-full max-w-sm sm:max-w-md bg-surface-0 rounded-xl shadow-lg p-6 sm:p-10">

      <!-- App title -->
      <div class="text-center mb-8">
        <i class="pi pi-file-edit text-4xl text-primary mb-3 block" />
        <h1 class="text-2xl font-bold text-surface-800">Notes Manager</h1>
      </div>

      <!-- Login Form -->
      <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="flex flex-col gap-5">
        <h2 class="text-lg font-semibold text-surface-700 mb-1">Sign In</h2>

        <FloatLabel>
          <InputText id="login-email" v-model="email" type="email" class="w-full" required autocomplete="email" />
          <label for="login-email">Email</label>
        </FloatLabel>

        <FloatLabel>
          <Password id="login-password" v-model="password" class="w-full" :feedback="false" toggleMask required
            inputClass="w-full" autocomplete="current-password" />
          <label for="login-password">Password</label>
        </FloatLabel>

        <Message v-if="errorMessage" severity="error" :closable="false" class="w-full">{{ errorMessage }}</Message>

        <Button type="submit" label="Sign In" icon="pi pi-sign-in" class="w-full" :loading="loading" />

        <div class="flex flex-wrap items-center justify-center gap-2 text-sm mt-1">
          <Button label="Create an account" link size="small" @click="switchMode('signup')" />
          <span class="text-surface-400">·</span>
          <Button label="Confirm account" link size="small" @click="switchMode('confirm')" />
        </div>
        <div class="text-center">
          <Button label="Continue as Guest" link size="small" icon="pi pi-user" @click="continueAsGuest" />
        </div>
      </form>

      <!-- Sign Up Form -->
      <form v-else-if="mode === 'signup'" @submit.prevent="handleSignup" class="flex flex-col gap-5">
        <h2 class="text-lg font-semibold text-surface-700 mb-1">Create Account</h2>

        <FloatLabel>
          <InputText id="signup-name" v-model="name" type="text" class="w-full" required autocomplete="name" />
          <label for="signup-name">Name</label>
        </FloatLabel>

        <FloatLabel>
          <InputText id="signup-email" v-model="email" type="email" class="w-full" required autocomplete="email" />
          <label for="signup-email">Email</label>
        </FloatLabel>

        <FloatLabel>
          <Password id="signup-password" v-model="password" class="w-full" toggleMask required
            inputClass="w-full" autocomplete="new-password" />
          <label for="signup-password">Password</label>
        </FloatLabel>

        <FloatLabel>
          <Select id="signup-group" v-model="group" :options="groupOptions" optionLabel="label" optionValue="value"
            class="w-full" />
          <label for="signup-group">Group</label>
        </FloatLabel>

        <Message v-if="errorMessage" severity="error" :closable="false" class="w-full">{{ errorMessage }}</Message>
        <Message v-if="successMessage" severity="success" :closable="false" class="w-full">{{ successMessage }}</Message>

        <Button type="submit" label="Sign Up" icon="pi pi-user-plus" class="w-full" :loading="loading" />

        <div class="text-center">
          <Button label="Back to Sign In" link size="small" icon="pi pi-arrow-left" @click="switchMode('login')" />
        </div>
      </form>

      <!-- Confirm Code Form -->
      <form v-else-if="mode === 'confirm'" @submit.prevent="handleConfirm" class="flex flex-col gap-5">
        <h2 class="text-lg font-semibold text-surface-700 mb-1">Confirm Account</h2>

        <FloatLabel>
          <InputText id="confirm-email" v-model="email" type="email" class="w-full" required autocomplete="email" />
          <label for="confirm-email">Email</label>
        </FloatLabel>

        <FloatLabel>
          <InputText id="confirm-code" v-model="code" type="text" class="w-full" required
            placeholder=" " autocomplete="one-time-code" />
          <label for="confirm-code">Confirmation Code</label>
        </FloatLabel>

        <Message v-if="errorMessage" severity="error" :closable="false" class="w-full">{{ errorMessage }}</Message>
        <Message v-if="successMessage" severity="success" :closable="false" class="w-full">{{ successMessage }}</Message>

        <Button type="submit" label="Confirm" icon="pi pi-check" class="w-full" :loading="loading" />

        <div class="text-center">
          <Button label="Back to Sign In" link size="small" icon="pi pi-arrow-left" @click="switchMode('login')" />
        </div>
      </form>

    </div>
  </div>
</template>
