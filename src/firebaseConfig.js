// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCbbGZYhEtO7X-zeqCzG1dpCMm1WwaFoRU",
  authDomain: "bluejay-4ed79.firebaseapp.com",
  projectId: "bluejay-4ed79",
  storageBucket: "bluejay-4ed79.appspot.com",
  messagingSenderId: "563545406235",
  appId: "1:563545406235:web:374fbfd1e6044b4d16f1be",
  measurementId: "G-8ZYCBW60RC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage, analytics };

export default app;
