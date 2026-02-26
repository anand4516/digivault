import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCbj4zK9gWAR3LjymJQKQXwnYMghufEdWY",
  authDomain: "business-91313.firebaseapp.com",
  projectId: "business-91313",
  storageBucket: "business-91313.firebasestorage.app",
  messagingSenderId: "1090566307536",
  appId: "1:1090566307536:web:70eeb74631772101eea8d5",
  measurementId: "G-2PSESGY81Q",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
