import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 🔴 请在此处填入你的真实 Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyBIXM_YBlyVwuFad3Y-GB5U9aN2Mimi5gc",
  authDomain: "mahjong-pro-256b9.firebaseapp.com",
  projectId: "mahjong-pro-256b9",
  storageBucket: "mahjong-pro-256b9.firebasestorage.app",
  messagingSenderId: "1072025993542",
  appId: "1:1072025993542:web:06c1be124ab531054ba547",
  measurementId: "G-D2FB8194KC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = 'mahjong-pro';