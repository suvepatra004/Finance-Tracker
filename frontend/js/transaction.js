const API = "https://finance-tracker-guaj.onrender.com/api";

const token = localStorage.getItem("token");
if (!token) window.location.href = "index.html";

document.getElementById("userName").textContent =
  localStorage.getItem("userName") || "User";
document.getElementById("userAvatar").textContent = (localStorage.getItem(
  "userName",
) || "U")[0].toUpperCase();

document.getElementById("filterMonth").value = new Date()
  .toISOString()
  .slice(0, 7);

let searchTimer = null;
let allTransactions = []; // merged list
let currentPage = 1;
const PAGE_SIZE = 10;

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

// ===== FETCH ALL DATA & MERGE =====
async function fetchAllTransactions() {
  const month = document.getElementById("filterMonth").value;

  // Fetch ALL pages of expenses and income for selected month
  let expParams = `page=1&limit=1000`;
  let incParams = `page=1&limit=1000`;
  if (month) {
    expParams += `&month=${month}`;
  }

  try {
    const [expRes, incRes] = await Promise.all([
      authFetch(`${API}/expenses?${expParams}`),
      authFetch(`${API}/income?${incParams}`),
    ]);
    if (!expRes || !incRes) return [];

    const expData = await expRes.json();
    const incData = await incRes.json();

    const expenses = (expData.data || []).map((e) => ({
      id: e.id,
      type: "expense",
      date: e.date,
      label: e.category,
      description: e.description || "—",
      amount: parseFloat(e.amount),
    }));

    // Filter income by month on frontend since backend doesn't support month filter
    let incomes = (incData.data || []).map((i) => ({
      id: i.id,
      type: "income",
      date: i.date,
      label: i.source,
      description: formatFrequency(i.frequency),
      amount: parseFloat(i.amount),
    }));

    if (month) {
      incomes = incomes.filter((i) => i.date && i.date.slice(0, 7) === month);
    }

    // Merge and sort by date descending
    const merged = [...expenses, ...incomes].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );

    return merged;
  } catch (err) {
    console.error("Fetch transactions error:", err);
    return [];
  }
}

function formatFrequency(f) {
  const map = {
    monthly: "Monthly",
    weekly: "Weekly",
    "one-time": "One-time",
    yearly: "Yearly",
  };
  return map[f] || f || "—";
}

// ===== APPLY FILTERS ON MERGED DATA =====
function getFiltered() {
  const search = document
    .getElementById("searchInput")
    .value.trim()
    .toLowerCase();
  const type = document.getElementById("filterType").value;
  const category = document.getElementById("filterCategory").value;

  return allTransactions.filter((tx) => {
    if (type && tx.type !== type) return false;
    if (category && tx.type === "expense" && tx.label !== category)
      return false;
    if (
      search &&
      !tx.label.toLowerCase().includes(search) &&
      !tx.description.toLowerCase().includes(search)
    )
      return false;
    return true;
  });
}

// ===== RENDER TABLE =====
function renderTable(page = 1) {
  currentPage = page;
  const filtered = getFiltered();
  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const offset = (page - 1) * PAGE_SIZE;
  const pageData = filtered.slice(offset, offset + PAGE_SIZE);

  const tbody = document.getElementById("txTableBody");

  if (!pageData.length) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="empty-state">No transactions found</td></tr>';
    document.getElementById("pagination").innerHTML = "";
    document.getElementById("paginationInfo").textContent = "";
    return;
  }

  tbody.innerHTML = pageData
    .map(
      (tx, i) => `
    <tr>
      <td style="color:var(--text-muted)">${offset + i + 1}</td>
      <td>${new Date(tx.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
      <td>
        <span class="badge ${tx.type === "income" ? "badge-income" : "badge-expense"}">
          ${tx.type === "income" ? "💵 Income" : "💸 Expense"}
        </span>
      </td>
      <td><span class="badge ${tx.type === "income" ? "badge-income" : "badge-expense"}" style="opacity:0.8">${tx.label}</span></td>
      <td style="color:var(--text-secondary)">${tx.description}</td>
      <td class="${tx.type === "income" ? "amount-income" : "amount-expense"}">${formatCurrency(tx.amount)}</td>
      <td>
        <button class="btn-delete" onclick="${tx.type === "income" ? `deleteIncome(${tx.id})` : `deleteExpense(${tx.id})`}">🗑 Delete</button>
      </td>
    </tr>
  `,
    )
    .join("");

  renderPagination(totalPages, page, total);
}

// ===== LOAD ALL + RENDER =====
async function loadTransactions() {
  const tbody = document.getElementById("txTableBody");
  tbody.innerHTML =
    '<tr><td colspan="7" class="empty-state">Loading...</td></tr>';
  allTransactions = await fetchAllTransactions();
  renderTable(1);
}

// ===== FILTERS =====
function applyFilters() {
  renderTable(1);
}

function debounceSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => renderTable(1), 400);
}

function clearFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("filterType").value = "";
  document.getElementById("filterCategory").value = "";
  document.getElementById("filterMonth").value = new Date()
    .toISOString()
    .slice(0, 7);
  loadTransactions();
}

// ===== DELETE =====
async function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;
  try {
    const res = await authFetch(`${API}/expenses/${id}`, { method: "DELETE" });
    if (res && res.ok) await loadTransactions();
  } catch (err) {
    console.error("Delete expense error:", err);
  }
}

async function deleteIncome(id) {
  if (!confirm("Delete this income?")) return;
  try {
    const res = await authFetch(`${API}/income/${id}`, { method: "DELETE" });
    if (res && res.ok) await loadTransactions();
  } catch (err) {
    console.error("Delete income error:", err);
  }
}

// ===== PAGINATION =====
function renderPagination(totalPages, current, total) {
  const container = document.getElementById("pagination");
  const info = document.getElementById("paginationInfo");
  const start = (current - 1) * PAGE_SIZE + 1;
  const end = Math.min(current * PAGE_SIZE, total);
  info.textContent = `Showing ${start}–${end} of ${total} transactions`;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = `<button class="page-btn" onclick="renderTable(${current - 1})" ${current === 1 ? "disabled" : ""}>← Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - current) <= 1) {
      html += `<button class="page-btn ${i === current ? "active" : ""}" onclick="renderTable(${i})">${i}</button>`;
    } else if (Math.abs(i - current) === 2) {
      html += `<span style="color:var(--text-muted);padding:7px 4px">…</span>`;
    }
  }
  html += `<button class="page-btn" onclick="renderTable(${current + 1})" ${current === totalPages ? "disabled" : ""}>Next →</button>`;
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
loadTransactions();
