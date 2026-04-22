import PocketBase, { AsyncAuthStore } from 'pocketbase'

const store = new AsyncAuthStore({
  save: (serialized) => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('pb_auth', serialized)
    }
  },
  initial: typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('pb_auth') || '' : '',
  clear: () => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('pb_auth')
    }
  },
})

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL, store)
pb.autoCancellation(false)

export default pb
