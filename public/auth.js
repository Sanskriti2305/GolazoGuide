const login = document.getElementById("loginForm");
const signup = document.getElementById("signupForm");
const SUPABASE_URL = "https://vhbuxlmzecflwfpaqxfr.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoYnV4bG16ZWNmbHdmcGFxeGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1OTI5OTcsImV4cCI6MjA5OTE2ODk5N30.0EUqWZxTh1RnVIbHDj_UDkiyvZvoyJDBGJZj7Fhu1TY"
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

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

  window.location.href = "index.html";
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

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
