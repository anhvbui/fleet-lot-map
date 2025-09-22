import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-analytics.js";


const firebaseConfig = {
    apiKey: "AIzaSyD7qC5px8dXI0mbMqpwDh6DzcWc17P64e0",
    authDomain: "yard-app-81e9c.firebaseapp.com",
    projectId: "yard-app-81e9c",
    storageBucket: "yard-app-81e9c.firebasestorage.app",
    messagingSenderId: "736027077936",
    appId: "1:736027077936:web:4a9c49829e6a3d6831acf5",
    measurementId: "G-3NV6NH0Z15"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
