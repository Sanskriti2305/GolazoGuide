const login = document.getElementById("loginForm");
const signup = document.getElementById("signupForm");
const SUPABASE_URL = "https://vhbuxlmzecflwfpaqxfr.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoYnV4bG16ZWNmbHdmcGFxeGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1OTI5OTcsImV4cCI6MjA5OTE2ODk5N30.0EUqWZxTh1RnVIbHDj_UDkiyvZvoyJDBGJZj7Fhu1TY"
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Basic format check — catches obviously malformed emails (missing @, no
// domain, etc.) before we even call Supabase. Not a substitute for real
// deliverability checking, just a fast first filter.
function isValidEmailFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isStrongPassword(password) {
  // At least 8 characters, one uppercase, one lowercase, one number
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!isValidEmailFormat(email)) {
    alert("Please enter a valid email address.");
    return;
  }
  if (!isStrongPassword(password)) {
    alert("Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } }
  });

  if (error) {
    alert("Signup failed: " + error.message);
    return;
  }

  // With "Confirm email" enabled in Supabase, signUp() succeeds but there's
  // no active session yet — the user must click the emailed link first.
  // data.session will be null in that case, so we shouldn't redirect to
  // index.html (checkAuth() would just bounce them straight back here).
  if (!data.session) {
    alert("Account created! Please check your email to confirm your account before logging in.");
    signup.classList.remove("active");
    login.classList.add("active");
    return;
  }

  window.location.href = "index.html";
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (!isValidEmailFormat(email)) {
    alert("Please enter a valid email address.");
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    alert("Login failed: " + error.message);
    return;
  }

  window.location.href = "index.html";
});

document.getElementById("showSignup").onclick=()=>{

login.classList.remove("active");
signup.classList.add("active");

}

document.getElementById("showLogin").onclick=()=>{

signup.classList.remove("active");
login.classList.add("active");

}
document.querySelectorAll(".toggle-password").forEach(icon => {
  icon.addEventListener("click", () => {
    const input = document.getElementById(icon.dataset.target);
    const faIcon = icon.querySelector("i");

    if (input.type === "password") {
      input.type = "text";
      faIcon.classList.remove("fa-eye");
      faIcon.classList.add("fa-eye-slash");
    } else {
      input.type = "password";
      faIcon.classList.remove("fa-eye-slash");
      faIcon.classList.add("fa-eye");
    }
  });
});