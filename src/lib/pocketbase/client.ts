import PocketBase, { AsyncAuthStore } from 'pocketbase'

// Remove any lingering persistent session from localStorage
if (typeof localStorage !== 'undefined') {
  localStorage.removeItem('pb_auth')
}

// Implement sessionStorage-based AuthStore for the client
const authStore = new AsyncAuthStore({
  save: async (serialized) => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('pb_auth', serialized)
    }
  },
  initial:
    typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem('pb_auth') || undefined
      : undefined,
  clear: async () => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('pb_auth')
    }
  },
})

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL, authStore)
pb.autoCancellation(false)

export default pb
