import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCp9r0YHOEA2bTQ8IC86DHG-lwLcMmMPEE",
  authDomain: "login-a6db2.firebaseapp.com",
  projectId: "login-a6db2",
  storageBucket: "login-a6db2.firebasestorage.app",
  messagingSenderId: "54990518433",
  appId: "1:54990518433:web:fb1ea505e60e912913d8e0"
};
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // not logged in, send back to login
    window.location.href = "index.html";
    return;
  }

  // fetch this user's Firestore document
  const userSnap = await getDoc(doc(db, "users", user.uid));
  if (!userSnap.exists()) {
    window.location.href = "index.html";
    return;
  }

  const data = userSnap.data();

  // fill in the page
  document.getElementById("userNumber").textContent     = data.userNo;
  document.getElementById("userNumberText").textContent = data.userNo;

  // total users from counter
  const counterSnap = await getDoc(doc(db, "meta", "counter"));
  document.getElementById("totalUsers").textContent = counterSnap.exists()
    ? counterSnap.data().count
    : data.userNo;

  // join date
  if (data.joinedAt) {
    const d = data.joinedAt.toDate();
    document.getElementById("joinDate").textContent =
      months[d.getMonth()] + " " + d.getDate();
  }
});

document.getElementById("logoutButton").addEventListener("click", async () => {
  await signOut(auth);                           // sign out from Firebase Auth
  window.location.href = "index.html";
});