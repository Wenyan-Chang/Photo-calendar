// Import the functions you need from the SDKs you need
import { initializeApp }   from 'firebase/app'
import { getAuth }         from 'firebase/auth'
import { getFirestore }    from 'firebase/firestore'
import { getStorage }      from 'firebase/storage'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCiTt8sT2AB617XN3TTKMeWfZxXcsIO8g8",
    authDomain: "calendar-523e8.firebaseapp.com",
    projectId: "calendar-523e8",
    storageBucket: "calendar-523e8.firebasestorage.app",
    messagingSenderId: "511342720597",
    appId: "1:511342720597:web:58d59e5aaaa56087f606dc",
    measurementId: "G-ZEFQCTC07V"
  };

// Initialize Firebase
const app       = initializeApp(firebaseConfig)
export const auth    = getAuth(app)
export const db      = getFirestore(app)
export const storage = getStorage(app)