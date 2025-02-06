import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"
import { collection, addDoc, getDocs } from "@firebase/firestore"; // Perbarui ini


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCXneDZGztk2SPvksENKU1VMrOaw96tCBI",
  authDomain: "web-portfolio-885fc.firebaseapp.com",
  projectId: "web-portfolio-885fc",
  storageBucket: "web-portfolio-885fc.firebasestorage.app",
  messagingSenderId: "473239575950",
  appId: "1:473239575950:web:f9881033931f6d0bac58df",
  measurementId: "G-5WSPPM4NNH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc };