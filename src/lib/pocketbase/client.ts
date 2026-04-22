import PocketBase, { BaseAuthStore } from 'pocketbase'

class SessionAuthStore extends BaseAuthStore {
  private storageKey: string

  constructor(storageKey = 'pb_auth') {
    super()
    this.storageKey = storageKey

    // Clean up old localStorage data if present
    try {
      window.localStorage.removeItem(this.storageKey)
    } catch (e) {
      // ignore
    }

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

  save(token: string, model?: any) {
    super.save(token, model)
    try {
      window.sessionStorage.setItem(this.storageKey, JSON.stringify({ token, model }))
    } catch (e) {
      // ignore
    }
  }

  clear() {
    super.clear()
    try {
      window.sessionStorage.removeItem(this.storageKey)
    } catch (e) {
      // ignore
    }
  }
}

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL, new SessionAuthStore('pb_auth'))
pb.autoCancellation(false)

export default pb
