import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC74dgzgPQaXdAQuQhl-1gUDpVAgtrGVw4",
  authDomain: "optimum-frame-b3kpg.firebaseapp.com",
  projectId: "optimum-frame-b3kpg",
  storageBucket: "optimum-frame-b3kpg.firebasestorage.app",
  messagingSenderId: "145236086180",
  appId: "1:145236086180:web:ec06dbeb1f5f5992590531"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
// We pass the specific custom database ID configured by AI Studio
export const db = getFirestore(app, "ai-studio-df84fe4d-6764-4f00-a58a-e280a3ccace6");
