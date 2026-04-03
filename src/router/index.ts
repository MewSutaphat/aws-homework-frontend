import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import CreateNote from '../components/CreateNote.vue'
import DeleteNote from '../components/DeleteNote.vue'
import EditNote from '../components/EditNote.vue'
import ShowAllNotes from '../components/ShowAllNotes.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: Login, meta: { public: true } },
    { path: '/create', component: CreateNote },
    { path: '/delete', component: DeleteNote },
    { path: '/edit', component: EditNote },
    { path: '/show', component: ShowAllNotes },
  ],
})

router.beforeEach((to) => {
  const isAuthenticated = !!localStorage.getItem('token')
  const isGuest = !!sessionStorage.getItem('guest')
  if (!to.meta.public && !isAuthenticated && !isGuest) {
    return '/login'
  }
  if (to.path === '/login' && isAuthenticated) {
    return '/create'
  }
})

export default router
