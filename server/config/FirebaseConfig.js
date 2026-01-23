import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, getDoc, getDocs } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAkhfNZsLnQMIKiT9a8cOgTmYMmMW-IX1M",
  authDomain: "apolloscheduler-af4c9.firebaseapp.com",
  projectId: "apolloscheduler-af4c9",
  storageBucket: "apolloscheduler-af4c9.firebasestorage.app",
  messagingSenderId: "574144191207",
  appId: "1:574144191207:web:cedfc05218be8da189e042",
  measurementId: "G-KCHQYWM3T7"
};


// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
export const analytics = getAnalytics(firebaseApp);
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);

// detect auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is signed in:", user);
  } else {
    console.log("No user is signed in.");
  }
});