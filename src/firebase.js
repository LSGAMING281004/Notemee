import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDCOxuDg3NipzgIYvzIvW5wYtd7EefSOhE",
  authDomain: "account-create-2c8fb.firebaseapp.com",
  databaseURL: "https://account-create-2c8fb-default-rtdb.firebaseio.com",
  projectId: "account-create-2c8fb",
  storageBucket: "account-create-2c8fb.firebasestorage.app",
  messagingSenderId: "165741844179",
  appId: "1:165741844179:web:a5495df89fa21aafaaa626",
  measurementId: "G-D2Q3ETZWRF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
