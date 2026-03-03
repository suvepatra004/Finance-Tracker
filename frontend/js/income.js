const API = "https://finance-tracker-guaj.onrender.com/api";

const token = localStorage.getItem("token");
if (!token) window.location.href = "index.html";

document.getElementById("userName").textContent =
  localStorage.getItem("userName") || "User";
document.getElementById("userAvatar").textContent = (localStorage.getItem(
  "userName",
) || "U")[0].toUpperCase();

const incomeMonth = document.getElementById("incomeMonth");
incomeMonth.value = new Date().toISOString().slice(0, 7);
document.getElementById("incDate").valueAsDate = new Date();

let currentPage = 1;

async function authFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (res.status === 401) {
    logout();
    return null;
  }
  return res;
}

function formatCurrency(amount) {
  return (
    "₹" +
    parseFloat(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    })
  );
}

function formatFrequency(f) {
  const map = {
    monthly: "Monthly",
    weekly: "Weekly",
    "one-time": "One-time",
    yearly: "Yearly",
  };
  return map[f] || f;
}

// ===== ADD INCOME =====
async function addIncome(e) {
  e.preventDefault();
  const btn = document.getElementById("addIncomeBtn");
  btn.textContent = "Adding...";
  btn.disabled = true;

  try {
    const res = await authFetch(`${API}/income`, {
      method: "POST",
      body: JSON.stringify({
        amount: document.getElementById("incAmount").value,
        source: document.getElementById("incSource").value,
        frequency: document.getElementById("incFrequency").value,
        date: document.getElementById("incDate").value,
      }),
    });
    if (res && res.ok) {
      document.getElementById("addIncomeForm").reset();
      document.getElementById("incDate").valueAsDate = new Date();
      incomeMonth.value = new Date().toISOString().slice(0, 7);
      await loadIncomePage(1);
      await loadIncomeBreakdown();
    }
  } catch (err) {
    console.error("Add income error:", err);
  } finally {
    btn.textContent = "Add Income";
    btn.disabled = false;
  }
}

// ===== LOAD INCOME TABLE =====
async function loadIncomePage(page = 1) {
  currentPage = page;
  const month = incomeMonth.value;
  const tbody = document.getElementById("incomeTableBody");
  tbody.innerHTML =
    '<tr><td colspan="6" class="empty-state">Loading...</td></tr>';

  try {
    const res = await authFetch(`${API}/income?page=${page}&limit=10`);
    if (!res) return;
    const data = await res.json();

    if (!data.data.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="empty-state">No income records found</td></tr>';
      document.getElementById("incomePagination").innerHTML = "";
      document.getElementById("incomePaginationInfo").textContent = "";
      return;
    }

    const offset = (page - 1) * 10;
    tbody.innerHTML = data.data
      .map(
        (inc, i) => `
      <tr>
        <td style="color:var(--text-muted)">${offset + i + 1}</td>
        <td>${new Date(inc.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
        <td><span class="badge badge-income">${inc.source}</span></td>
        <td style="color:var(--text-secondary)">${formatFrequency(inc.frequency)}</td>
        <td class="amount-income">${formatCurrency(inc.amount)}</td>
        <td><button class="btn-delete" onclick="deleteIncome(${inc.id})">🗑 Delete</button></td>
      </tr>
    `,
      )
      .join("");

    renderPagination(data.totalPages, page, data.total);
  } catch (err) {
    console.error("Load income error:", err);
  }
}

// ===== SOURCE BREAKDOWN =====
async function loadIncomeBreakdown() {
  const month = incomeMonth.value;
  try {
    const res = await authFetch(`${API}/income/summary?month=${month}`);
    if (!res) return;
    const data = await res.json();
    const container = document.getElementById("incomeBreakdown");

    if (!data.breakdown || !data.breakdown.length) {
      container.innerHTML =
        '<div class="empty-state">No income this month</div>';
      return;
    }

    const max = Math.max(...data.breakdown.map((b) => parseFloat(b.total)));
    container.innerHTML = data.breakdown
      .map(
        (b) => `
      <div class="category-item">
        <div class="category-row">
          <span class="category-name">${b.source}</span>
          <span class="category-amount" style="color:#6ee7b7">${formatCurrency(b.total)}</span>
        </div>
        <div class="category-bar-bg">
          <div class="category-bar-fill" style="width:${Math.round((parseFloat(b.total) / max) * 100)}%;background:linear-gradient(90deg,#10b981,#34d399)"></div>
        </div>
      </div>
    `,
      )
      .join("");
  } catch (err) {
    console.error("Income breakdown error:", err);
  }
}

// ===== DELETE INCOME =====
async function deleteIncome(id) {
  if (!confirm("Delete this income record?")) return;
  try {
    const res = await authFetch(`${API}/income/${id}`, { method: "DELETE" });
    if (res && res.ok) {
      await loadIncomePage(currentPage);
      await loadIncomeBreakdown();
    }
  } catch (err) {
    console.error("Delete income error:", err);
  }
}

// ===== PAGINATION =====
function renderPagination(totalPages, current, total) {
  const container = document.getElementById("incomePagination");
  const info = document.getElementById("incomePaginationInfo");
  const start = (current - 1) * 10 + 1;
  const end = Math.min(current * 10, total);
  info.textContent = `Showing ${start}–${end} of ${total} records`;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = `<button class="page-btn" onclick="loadIncomePage(${current - 1})" ${current === 1 ? "disabled" : ""}>← Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - current) <= 1) {
      html += `<button class="page-btn ${i === current ? "active" : ""}" onclick="loadIncomePage(${i})">${i}</button>`;
    } else if (Math.abs(i - current) === 2) {
      html += `<span style="color:var(--text-muted);padding:7px 4px">…</span>`;
    }
  }
  html += `<button class="page-btn" onclick="loadIncomePage(${current + 1})" ${current === totalPages ? "disabled" : ""}>Next →</button>`;
  container.innerHTML = html;
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ===== INIT =====
loadIncomePage(1);
loadIncomeBreakdown();
