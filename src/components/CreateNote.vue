<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import { getNameFromToken } from '../utils/token'
import GuestDialog from './GuestDialog.vue'

const name = getNameFromToken()
const noteID = ref('')
const content = ref('')
const dialogMessage = ref('')
const dialogType = ref<'success' | 'error'>('success')
const showDialog = ref(false)
const showGuestDialog = ref(false)

async function handleSubmit() {
  if (sessionStorage.getItem('guest')) {
    showGuestDialog.value = true
    return
  }
  try {
    const response = await axios.post(
      'https://d9tej631xf.execute-api.ap-southeast-7.amazonaws.com/prod/notes/create',
      {
        name: name,
        noteId: noteID.value,
        noteMsg: content.value,
      },
      { headers: { Authorization: localStorage.getItem('token') ?? '' } }
    )
    if (response.status === 200) {
      dialogMessage.value = 'Note created successfully!'
      dialogType.value = 'success'
      showDialog.value = true
    } else {
      dialogMessage.value = `Unexpected error (status ${response.status})`
      dialogType.value = 'error'
      showDialog.value = true
    }
  } catch (error: any) {
    if (error.response?.status === 401) {
      showGuestDialog.value = true
    } else {
      const message = error.response?.data?.message ?? error.message
      dialogMessage.value = `${message}`
      dialogType.value = 'error'
      showDialog.value = true
    }
  }
}
</script>

<template>
  <div class="page">
    <h2>Create Note</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <p class="name-display"><span class="name-label">Name</span> : {{ name }}</p>
      </div>
      <div class="form-group">
        <label>Note ID</label>
        <input v-model="noteID" type="text" placeholder="Enter note ID" required />
      </div>
      <div class="form-group">
        <label>Note Content</label>
        <textarea v-model="content" placeholder="Enter note content" rows="6" required></textarea>
      </div>
      <button type="submit" class="submit-btn">Submit</button>
    </form>
  </div>

  <!-- Custom Dialog -->
  <div v-if="showDialog" class="dialog-overlay" @click.self="showDialog = false">
    <div class="dialog" :class="dialogType">
      <p>{{ dialogMessage }}</p>
      <button class="dialog-btn" @click="showDialog = false">OK</button>
    </div>
  </div>
  <GuestDialog :show="showGuestDialog" @close="showGuestDialog = false" />
</template>

<style>
@import '../assets/dialog.css';
</style>

<style scoped>
.page h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 28px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
  font-size: 0.9rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  max-width: 480px;
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
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.form-group textarea {
  resize: vertical;
}

.name-display {
  font-size: 1.5rem;
  color: #082e6b;
  margin: 0;
}

.name-label {
  font-weight: 600;
  color: #475569;
}

.form-group input:disabled {
  background: #f1f5f9;
  color: #64748b;
  cursor: not-allowed;
}

.submit-btn {
  margin-top: 8px;
  padding: 10px 28px;
  background-color: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.submit-btn:hover {
  background-color: #2563eb;
}
</style>
