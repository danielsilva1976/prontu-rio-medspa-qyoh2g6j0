import PocketBase, { BaseAuthStore } from 'pocketbase'

class SessionAuthStore extends BaseAuthStore {
  private storageKey = 'pb_auth_session'

  constructor() {
    super()
    if (typeof window !== 'undefined') {
      // Clear legacy localStorage token for security
      try {
        window.localStorage.removeItem('pocketbase_auth')
      } catch (e) {}

      try {
        const raw = window.sessionStorage.getItem(this.storageKey)
        if (raw) {
          const parsed = JSON.parse(raw)
          this.save(parsed.token, parsed.model)
        }
      } catch (e) {
        // ignore
      }
    }
  }

  save(token: string, model: any) {
    super.save(token, model)
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem(this.storageKey, JSON.stringify({ token, model }))
      } catch (e) {}
    }
  }

  clear() {
    super.clear()
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(this.storageKey)
      } catch (e) {}
    }
  }
}

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL, new SessionAuthStore())
pb.autoCancellation(false)

export default pb
