import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig={
  apiKey:"AIzaSyDMGU5X7BBp-C6tIl34Uuu5N9MXAVFTn7c",
  authDomain:"paper-house-inc.firebaseapp.com",
  databaseURL:"https://paper-house-inc-default-rtdb.firebaseio.com/",
  projectId:"paper-house-inc",
  storageBucket:"paper-house-inc.appspot.com",
  messagingSenderId:"658389836376",
  appId:"1:658389836376:web:2ab1e2743c593f4ca8e02d"
};

const app=initializeApp(firebaseConfig);
export const db=getDatabase(app);
