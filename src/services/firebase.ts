import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {

  apiKey: "AIzaSyCPE9rT3ZnPsVsZO71xxxKiSQpTsFs9UAU",

  authDomain: "zenarog-86c72.firebaseapp.com",

  projectId: "zenarog-86c72",

  storageBucket: "zenarog-86c72.firebasestorage.app",

  messagingSenderId: "748240936104",

  appId: "1:748240936104:web:e4b74b332e0af88adb769d",

  measurementId: "G-T41YE3B1R4"

};


const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
