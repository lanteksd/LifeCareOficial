import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDBwYQfp-Yg0IRd3QV6DSAPZq1XdsunqXc",
  authDomain: "lifecareoficialilpi.firebaseapp.com",
  projectId: "lifecareoficialilpi",
  storageBucket: "lifecareoficialilpi.firebasestorage.app",
  messagingSenderId: "976068037589",
  appId: "1:976068037589:web:dfa1a4e55b99c24fbf4b5c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);