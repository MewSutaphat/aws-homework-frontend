<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { getNameFromToken } from '../utils/token'

interface Note {
  noteId: string
  noteContent: string
  userId: string
}

const name = getNameFromToken()
const notes = ref<Note[]>([])
const loading = ref(false)
const errorMessage = ref('')

async function fetchNotes() {
  if (sessionStorage.getItem('guest')) return
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await axios.post(
      'https://d9tej631xf.execute-api.ap-southeast-7.amazonaws.com/prod/notes/readAll',
      {
        name: name
      },
      { headers: { Authorization: localStorage.getItem('token') ?? '' } }
    )
    notes.value = response.data.notes
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message ?? error.message
  } finally {
    loading.value = false
  }
}

onMounted(fetchNotes)
</script>

<template>
  <div class="page">
    <h2>All Notes</h2>
    <p v-if="loading" class="status-row">Loading...</p>
    <p v-else-if="errorMessage" class="status-row error">{{ errorMessage }}</p>
    <table v-else class="notes-table">
      <thead>
        <tr>
          <th>Note ID</th>
          <th>Note Content</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="notes.length === 0">
          <td colspan="2" class="empty-row">No notes found.</td>
        </tr>
        <tr v-for="note in notes" :key="note.noteId">
          <td>{{ note.noteId }}</td>
          <td>{{ note.noteContent }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.page h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 28px;
}

.notes-table {
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.notes-table th {
  background-color: #1e293b;
  color: #f1f5f9;
  padding: 12px 20px;
  text-align: left;
  font-size: 0.9rem;
  font-weight: 600;
}

.notes-table td {
  padding: 12px 20px;
  color: #334155;
  font-size: 0.9rem;
  border-bottom: 1px solid #e2e8f0;
}

.notes-table tbody tr:last-child td {
  border-bottom: none;
}

.notes-table tbody tr:hover {
  background-color: #f1f5f9;
}

.empty-row {
  text-align: center;
  color: #94a3b8;
  padding: 32px !important;
}

.status-row {
  color: #64748b;
  font-size: 0.95rem;
}

.status-row.error {
  color: #dc2626;
}
</style>
