import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { collection, addDoc } from "@firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCXneDZGztk2SPvksENKU1VMrOaw96tCBI",
    authDomain: "web-portfolio-885fc.firebaseapp.com",
    projectId: "web-portfolio-885fc",
    storageBucket: "web-portfolio-885fc.firebasestorage.app",
    messagingSenderId: "473239575950",
    appId: "1:473239575950:web:f9881033931f6d0bac58df",
    measurementId: "G-5WSPPM4NNH"
};

// Initialize with a unique name
const app = initializeApp(firebaseConfig, 'comments-app');
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage, collection, addDoc };