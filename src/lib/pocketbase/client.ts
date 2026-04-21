import PocketBase, { BaseAuthStore } from 'pocketbase'

class SessionAuthStore extends BaseAuthStore {
  private storageKey: string

  constructor(storageKey = 'pocketbase_auth') {
    super()
    this.storageKey = storageKey

    try {
      // Clean up old persistent storage to ensure proper migration
      if (window.localStorage.getItem(this.storageKey)) {
        window.localStorage.removeItem(this.storageKey)
      }
    } catch (e) {
      // silent
    }

    try {
      const raw = window.sessionStorage.getItem(this.storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        this.save(parsed.token, parsed.model)
      }
    } catch (e) {
      // silent fallback
    }
  }

  save(token: string, model: any) {
    super.save(token, model)
    try {
      window.sessionStorage.setItem(this.storageKey, JSON.stringify({ token, model }))
    } catch (e) {
      // silent fallback
    }
  }

  clear() {
    super.clear()
    try {
      window.sessionStorage.removeItem(this.storageKey)
    } catch (e) {
      // silent fallback
    }
  }
}

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL, new SessionAuthStore())
pb.autoCancellation(false)

export default pb
