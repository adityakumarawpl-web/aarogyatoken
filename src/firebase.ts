import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Apni Firebase Console se mili hui details yahan daalein
const firebaseConfig = {
  apiKey: "AIzaSyDM9Ov55kgiJjN097g0gPxmu00v8lL0XJI",
  authDomain: "aarogyatoken.firebaseapp.com",
  projectId: "aarogyatoken",
  storageBucket: "aarogyatoken.firebasestorage.app",
  messagingSenderId: "459205888712",
  appId: "1:459205888712:web:a0b36d7f243608550033fd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and export db
export const db = getFirestore(app);
