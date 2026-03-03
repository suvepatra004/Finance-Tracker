const API = "https://finance-tracker-guaj.onrender.com/api";

// Auto-redirect if already logged in
if (localStorage.getItem("token")) {
  window.location.href = "dashboard.html";
}

// ===== TAB SWITCHER =====
function switchTab(tab) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const tabs = document.querySelectorAll(".tab-btn");

  tabs.forEach((btn) => btn.classList.remove("active"));

  if (tab === "login") {
    tabs[0].classList.add("active");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
  } else {
    tabs[1].classList.add("active");
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
  }
}

// ===== LOGIN =====
async function handleLogin(e) {
  e.preventDefault();

  const btn = document.getElementById("loginBtn");
  const err = document.getElementById("loginError");
  err.classList.add("hidden");
  btn.textContent = "Logging in...";
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: document.getElementById("loginEmail").value.trim(),
        password: document.getElementById("loginPassword").value,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    localStorage.setItem("token", data.token);
    localStorage.setItem("userName", data.name);
    window.location.href = "dashboard.html";
  } catch (error) {
    err.textContent = error.message;
    err.classList.remove("hidden");
    btn.textContent = "Login";
    btn.disabled = false;
  }
}

// ===== REGISTER =====
async function handleRegister(e) {
  e.preventDefault();

  const btn = document.getElementById("registerBtn");
  const err = document.getElementById("registerError");
  const suc = document.getElementById("registerSuccess");
  err.classList.add("hidden");
  suc.classList.add("hidden");
  btn.textContent = "Creating...";
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: document.getElementById("regName").value.trim(),
        email: document.getElementById("regEmail").value.trim(),
        password: document.getElementById("regPassword").value,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    suc.textContent = "✅ Account created! Please login.";
    suc.classList.remove("hidden");
    document.getElementById("registerForm").reset();
    setTimeout(() => switchTab("login"), 1500);
  } catch (error) {
    err.textContent = error.message;
    err.classList.remove("hidden");
  } finally {
    btn.textContent = "Create Account";
    btn.disabled = false;
  }
}

// ===== PASSWORD TOGGLE =====
function togglePassword(id) {
  const input = document.getElementById(id);
  input.type = input.type === "password" ? "text" : "password";
}
