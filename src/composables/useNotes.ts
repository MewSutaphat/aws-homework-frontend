import { ref } from 'vue'

export interface Note {
  noteId: string
  noteMessage: string
}

const notes = ref<Note[]>([
  { noteId: 'N001', noteMessage: 'Sample note content here' },
  { noteId: 'N002', noteMessage: 'Another note for demonstration' },
])

export function useNotes() {
  function addNote(noteId: string, noteMessage: string) {
    notes.value.push({ noteId, noteMessage })
  }

  function removeNote(noteId: string) {
    notes.value = notes.value.filter((n) => n.noteId !== noteId)
  }

  function updateNote(noteId: string, noteMessage: string): boolean {
    const note = notes.value.find((n) => n.noteId === noteId)
    if (!note) return false
    note.noteMessage = noteMessage
    return true
  }

  return { notes, addNote, removeNote, updateNote }
}
