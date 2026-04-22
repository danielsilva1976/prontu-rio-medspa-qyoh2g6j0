import PocketBase, { BaseAuthStore } from 'pocketbase'

class SessionAuthStore extends BaseAuthStore {
  private storageKey: string

  constructor(storageKey = 'pocketbase_auth') {
    super()
    this.storageKey = storageKey

    if (typeof window !== 'undefined') {
      try {
        const raw = window.sessionStorage.getItem(this.storageKey)
        if (raw) {
          const parsed = JSON.parse(raw)
          this.save(parsed.token, parsed.model)
        }
      } catch (e) {
        console.error('Failed to load SessionAuthStore', e)
      }
    }
  }

  save(token: string, model: any) {
    super.save(token, model)
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem(this.storageKey, JSON.stringify({ token, model }))
      } catch (e) {
        console.error('Failed to save SessionAuthStore', e)
      }
    }
  }

  clear() {
    super.clear()
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(this.storageKey)
      } catch (e) {
        console.error('Failed to clear SessionAuthStore', e)
      }
    }
  }
}

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL, new SessionAuthStore())
pb.autoCancellation(false)

export default pb
