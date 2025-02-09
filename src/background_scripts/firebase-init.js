

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDwOQPRg62Tc8Tz6gt5Fj6FLvuwE9Lsz3U",
    authDomain: "markup-database.firebaseapp.com",
    projectId: "markup-database",
    storageBucket: "markup-database.appspot.com",
    messagingSenderId: "137230744992",
    appId: "1:137230744992:web:952acf53f94a0a7e0378c5",
    measurementId: "G-DLY6ZBHLF2"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {db};