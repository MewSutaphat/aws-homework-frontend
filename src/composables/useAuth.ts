import { ref } from 'vue'
import axios from 'axios'
import router from '../router'

const isAuthenticated = ref(!!localStorage.getItem('token'))
const username = ref(localStorage.getItem('email') ?? '')

export function useAuth() {
  async function login(email: string, password: string) {
    const response = await axios.post(
      'https://d9tej631xf.execute-api.ap-southeast-7.amazonaws.com/prod/auth/login',
      { email, password }
    )
    const idToken = response.data.idToken ?? ''
    const accessToken = response.data.accessToken ?? ''
    let decoded: Record<string, any> = {}
    try {
      const part = idToken.split('.')[1]
      if (part) {
        decoded = JSON.parse(atob(part))
        console.log('idToken decoded:', decoded)
      }
    } catch (e) {
      console.error('Failed to decode idToken:', e)
    }

    localStorage.setItem('token', idToken)
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('email', email)
    username.value = email
    isAuthenticated.value = true
    await router.replace('/create')
  }

  async function signup(name: string, password: string, email: string, group: string) {
    await axios.post(
      'https://d9tej631xf.execute-api.ap-southeast-7.amazonaws.com/prod/auth/signup',
      {name, password, email, group }
    )
  }

  async function confirmCode(email: string, code: string) {
    await axios.post(
      'https://d9tej631xf.execute-api.ap-southeast-7.amazonaws.com/prod/auth/confirm',
      { email, code }
    )
  }

  async function logout() {
    try {
      await axios.post(
        'https://d9tej631xf.execute-api.ap-southeast-7.amazonaws.com/prod/auth/logout',
        {},
        { headers: { Authorization: `${localStorage.getItem('accessToken') ?? ''}` } }
      )
      console.log('Logout Success')
    } catch (error: any) {
      console.error('Logout error status:', error.response?.status)
      console.error('Logout error body:', error.response?.data)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('email')
      isAuthenticated.value = false
      username.value = ''
      router.push('/login')
    }
  }

  return { isAuthenticated, username, login, signup, confirmCode, logout }
}
