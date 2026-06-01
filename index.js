import { initializeApp } from "firebase/app";
import { getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  sendPasswordResetEmail
 } from "firebase/auth";
 import { getFirestore, doc, getDoc, setDoc, runTransaction, serverTimestamp } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCp9r0YHOEA2bTQ8IC86DHG-lwLcMmMPEE",
  authDomain: "login-a6db2.firebaseapp.com",
  projectId: "login-a6db2",
  storageBucket: "login-a6db2.firebasestorage.app",
  messagingSenderId: "54990518433",
  appId: "1:54990518433:web:fb1ea505e60e912913d8e0"
};

initializeApp(firebaseConfig) 

const auth = getAuth()
const db = getFirestore()

// assigns user number on first signup, fetches it on returning login
async function getOrAssignUserNumber(uid, email) {
  const userRef    = doc(db, "users", uid);
  const counterRef = doc(db, "meta", "counter");

  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data().userNo; // returning user, fetch their number
  }

  // new user — increment counter and save everything in one transaction
  let newNo;
  await runTransaction(db, async (tx) => {
    const counterSnap = await tx.get(counterRef);
    newNo = (counterSnap.exists() ? counterSnap.data().count : 0) + 1;
    tx.set(counterRef, { count: newNo });
    tx.set(userRef, {
      email: email,
      userNo: newNo,
      joinedAt: serverTimestamp()
    });
  });
  return newNo;
}

function showMsg(text, isError = true) {
  const el = document.getElementById("authMessage");
  el.textContent = text;
  el.style.display = "block";
  el.style.background   = isError ? "rgba(239,68,68,0.15)"  : "rgba(34,197,94,0.15)";
  el.style.borderColor  = isError ? "rgba(239,68,68,0.4)"   : "rgba(34,197,94,0.4)";
  el.style.color        = isError ? "#fca5a5"               : "#86efac";
  el.style.padding      = "12px 16px";
  el.style.borderRadius = "12px";
  el.style.border       = "1px solid";
  el.style.fontSize     = "0.85rem";
  el.style.marginBottom = "16px";
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  if (!email || !password) return showMsg("Please fill in all fields.");

  const btn = document.getElementById("loginButton");
  btn.textContent = "Signing in…";
  btn.disabled = true;

  try {
    const cred   = await signInWithEmailAndPassword(auth, email, password);
    const userNo = await getOrAssignUserNumber(cred.user.uid, email);
    window.location.href = "homePage.html?userNo=" + userNo;
  } catch (err) {
    showMsg(friendlyError(err.code));
    btn.textContent = "Sign In";
    btn.disabled = false;
  }
});

document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email    = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirm = document.getElementById("signupConfirmPassword").value;

  if (!email || !password || !confirm) return showMsg("Please fill in all fields.");
  if (password !== confirm)            return showMsg("Passwords do not match.");
  if (password.length < 6)            return showMsg("Password must be at least 6 characters.");

  const btn = document.getElementById("signupButton");
  btn.textContent = "Creating account…";
  btn.disabled = true;

  try {
    const cred   = await createUserWithEmailAndPassword(auth, email, password);
    const userNo = await getOrAssignUserNumber(cred.user.uid, email);
    window.location.href = "homePage.html?userNo=" + userNo;
  } catch (err) {
    showMsg(friendlyError(err.code));
    btn.textContent = "Create Account";
    btn.disabled = false;
  }
});

document.getElementById("googleLogin").addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const userNo = await getOrAssignUserNumber(result.user.uid, result.user.email);
    window.location.href = "homePage.html?userNo=" + userNo;
  } catch (err) {
    showMsg(friendlyError(err.code));
  }
});

document.getElementById("forgotPasswordLink").addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  if (!email) return showMsg("Enter your email above first.");
  try {
    await sendPasswordResetEmail(auth, email);
    showMsg("Reset email sent! Check your inbox.", false);
  } catch (err) {
    showMsg(friendlyError(err.code));
  }
});

function friendlyError(code) {
  const map = {
    "auth/user-not-found":       "No account found with this email.",
    "auth/wrong-password":       "Incorrect password.",
    "auth/email-already-in-use": "This email is already registered. Sign in instead.",
    "auth/invalid-email":        "Please enter a valid email address.",
    "auth/weak-password":        "Use at least 6 characters.",
    "auth/too-many-requests":    "Too many attempts. Try again later.",
    "auth/popup-closed-by-user": "Google sign-in was closed.",
    "auth/invalid-credential":   "Incorrect email or password.",
  };
  return map[code] || "Something went wrong. Please try again.";
}
