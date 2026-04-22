import PocketBase, { BaseAuthStore } from 'pocketbase'

class SessionAuthStore extends BaseAuthStore {
  private storageKey: string

  constructor(storageKey = 'pocketbase_auth') {
    super()
    this.storageKey = storageKey

    if (typeof window !== 'undefined') {
      // Clear legacy local storage to ensure strictly session-based auth
      if (window.localStorage) {
        window.localStorage.removeItem(this.storageKey)
      }

      if (window.sessionStorage) {
        const raw = window.sessionStorage.getItem(this.storageKey)
        if (raw) {
          try {
            const parsed = JSON.parse(raw)
            super.save(parsed.token, parsed.model)
          } catch (e) {
            // ignore error
          }
        }
      }
    }
  }

  save(token: string, model: any) {
    super.save(token, model)
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(this.storageKey, JSON.stringify({ token, model }))
    }
  }

  clear() {
    super.clear()
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(this.storageKey)
    }
  }
}

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL, new SessionAuthStore())
pb.autoCancellation(false)

export default pb
