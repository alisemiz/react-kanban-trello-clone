// src/firebase.js

import { initializeApp } from "firebase/app";
// YENİ: İhtiyacımız olan servisleri import ediyoruz
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// Not: getAnalytics'i sildim, çünkü projemizde kullanmıyoruz,
// kafa karıştırmasın.

// SENİN WEB UYGULAMANIN FIREBASE KONFİGÜRASYONU
// (Senin verdiğin kod)
const firebaseConfig = {
  apiKey: "AIzaSyB9iPij0IZD2cat8sGAjxaqvOSIglrNBq4",
  authDomain: "kanban-projesi-react.firebaseapp.com",
  projectId: "kanban-projesi-react",
  storageBucket: "kanban-projesi-react.firebasestorage.app",
  messagingSenderId: "568878872859",
  appId: "1:568878872859:web:2d075ec6ffc22f8ed17bbe",
  measurementId: "G-G7G6L0P5NT",
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// === HATA BURADAYDI ===
// Servisleri başlatıp 'export' (dışa aktar) etmeliyiz ki
// App.jsx dosyası bunları 'import' (içe aktar) edebilsin.
// (Artık 'auth' export ediliyor)
export const db = getFirestore(app);
export const auth = getAuth(app);
