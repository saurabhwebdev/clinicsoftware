// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCGifZDg0kPRXQxw3zenvrZcHDTEnsgoRU",
  authDomain: "clinicflow-3138b.firebaseapp.com",
  projectId: "clinicflow-3138b",
  storageBucket: "clinicflow-3138b.firebasestorage.app",
  messagingSenderId: "681464477166",
  appId: "1:681464477166:web:72af6ef3bbddc657f2caff",
  measurementId: "G-25RGXRWGEQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, googleProvider, db };
export default app; 