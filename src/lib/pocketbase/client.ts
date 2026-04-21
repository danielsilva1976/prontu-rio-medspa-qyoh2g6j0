import PocketBase, { BaseAuthStore } from 'pocketbase'

// Use a session-based auth store to require manual login for new visits,
// while allowing page refreshes within the same tab to remain authenticated.
class SessionAuthStore extends BaseAuthStore {
  save(token: string, model: any) {
    super.save(token, model)
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('pocketbase_auth', JSON.stringify({ token, model }))
    }
  }
  clear() {
    super.clear()
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('pocketbase_auth')
    }
  }
}

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)

if (typeof window !== 'undefined') {
  // Clear any existing localStorage session to enforce the new security policy
  window.localStorage.removeItem('pocketbase_auth')

  const store = new SessionAuthStore()
  const raw = window.sessionStorage.getItem('pocketbase_auth')
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      store.save(parsed.token, parsed.model)
    } catch (e) {
      // Ignore parse errors
    }
  }
  pb.authStore = store
}

pb.autoCancellation(false)

export default pb
