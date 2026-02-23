const DEMO_MODE = true

const mockAuth = {
  currentUser: DEMO_MODE ? { uid: 'demo-user', email: 'demo@zenarog.com' } : null
}

const mockDb = DEMO_MODE ? {} : null

export const auth = mockAuth
export const db = mockDb
export default { auth, db }
