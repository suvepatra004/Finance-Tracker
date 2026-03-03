const API = "https://finance-tracker-guaj.onrender.com/api";

// Auth guard
const token = localStorage.getItem("token");
if (!token) window.location.href = "index.html";

// Setup user info
document.getElementById("userName").textContent =
  localStorage.getItem("userName") || "User";
document.getElementById("userAvatar").textContent = (localStorage.getItem(
  "userName",
) || "U")[0].toUpperCase();

// Set greeting
const hour = new Date().getHours();
document.getElementById("greetingText").textContent =
  hour < 12
    ? "Good Morning 👋"
    : hour < 17
      ? "Good Afternoon 👋"
      : "Good Evening 👋";

// Set month picker to current month
const monthPicker = document.getElementById("monthPicker");
monthPicker.value = new Date().toISOString().slice(0, 7);
document.getElementById("currentMonth").textContent = new Date().toLocaleString(
  "default",
  { month: "long", year: "numeric" },
);

// Set today as default date in expense form
document.getElementById("expDate").valueAsDate = new Date();

// ===== AUTH FETCH HELPER =====
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

// ===== FORMAT CURRENCY =====
function formatCurrency(amount) {
  return (
    "₹" +
    parseFloat(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    })
  );
}

// ===== LOAD FULL DASHBOARD =====
async function loadDashboard() {
  const month = monthPicker.value;
  await Promise.all([
    loadSummary(month),
    loadRecentTransactions(),
    loadBudgetProgress(month),
  ]);
}

// ===== SUMMARY CARDS =====
async function loadSummary(month) {
  try {
    const [expRes, incRes] = await Promise.all([
      authFetch(`${API}/expenses/summary?month=${month}`),
      authFetch(`${API}/income/summary?month=${month}`),
    ]);
    if (!expRes || !incRes) return;

    const expData = await expRes.json();
    const incData = await incRes.json();

    const totalExpenses = parseFloat(expData.monthlyTotal || 0);
    const totalIncome = parseFloat(incData.monthlyTotal || 0);
    const net = totalIncome - totalExpenses;
    const savingsRate =
      totalIncome > 0 ? Math.round((net / totalIncome) * 100) : 0;

    document.getElementById("totalExpenses").textContent =
      formatCurrency(totalExpenses);
    document.getElementById("totalIncome").textContent =
      formatCurrency(totalIncome);

    const netEl = document.getElementById("netBalance");
    netEl.textContent = formatCurrency(net);
    netEl.style.color = net >= 0 ? "#6ee7b7" : "#fca5a5";

    document.getElementById("savingsRate").textContent = savingsRate + "%";

    renderCategoryBreakdown(expData.breakdown || []);
  } catch (err) {
    console.error("Summary error:", err);
  }
}

// ===== CATEGORY BREAKDOWN =====
function renderCategoryBreakdown(breakdown) {
  const container = document.getElementById("categorySummary");
  if (!breakdown.length) {
    container.innerHTML =
      '<div class="empty-state">No expenses this month</div>';
    return;
  }
  const maxAmount = Math.max(...breakdown.map((b) => parseFloat(b.total)));
  container.innerHTML = breakdown
    .map(
      (b) => `
    <div class="category-item">
      <div class="category-row">
        <span class="category-name">${b.category}</span>
        <span class="category-amount">${formatCurrency(b.total)}</span>
      </div>
      <div class="category-bar-bg">
        <div class="category-bar-fill" style="width:${Math.round((parseFloat(b.total) / maxAmount) * 100)}%"></div>
      </div>
    </div>
  `,
    )
    .join("");
}

// ===== RECENT TRANSACTIONS =====
async function loadRecentTransactions() {
  try {
    const [expRes, incRes] = await Promise.all([
      authFetch(`${API}/expenses?page=1&limit=5`),
      authFetch(`${API}/income?page=1&limit=5`),
    ]);
    if (!expRes || !incRes) return;

    const expData = await expRes.json();
    const incData = await incRes.json();

    const expenses = (expData.data || []).map((e) => ({
      date: e.date,
      label: e.category,
      description: e.description || "—",
      amount: parseFloat(e.amount),
      type: "expense",
      id: e.id,
    }));
    const incomes = (incData.data || []).map((i) => ({
      date: i.date,
      label: i.source,
      description: i.frequency || "—",
      amount: parseFloat(i.amount),
      type: "income",
      id: i.id,
    }));

    const recent = [...expenses, ...incomes]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    const tbody = document.getElementById("recentTableBody");
    if (!recent.length) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="empty-state">No transactions yet</td></tr>';
      return;
    }

    tbody.innerHTML = recent
      .map(
        (tx) => `
      <tr>
        <td>${new Date(tx.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
        <td><span class="badge ${tx.type === "income" ? "badge-income" : "badge-expense"}">${tx.label}</span></td>
        <td style="color:var(--text-secondary)">${tx.description}</td>
        <td class="${tx.type === "income" ? "amount-income" : "amount-expense"}">${formatCurrency(tx.amount)}</td>
        <td>
          <button class="btn-delete" onclick="${tx.type === "income" ? `deleteIncome(${tx.id})` : `deleteExpense(${tx.id})`}">🗑 Delete</button>
        </td>
      </tr>
    `,
      )
      .join("");
  } catch (err) {
    console.error("Recent transactions error:", err);
  }
}

// ======== Delete Income Button ===============
async function deleteIncome(id) {
  if (!confirm("Delete this income?")) return;
  try {
    const res = await authFetch(`${API}/income/${id}`, { method: "DELETE" });
    if (res && res.ok) await loadDashboard();
  } catch (err) {
    console.error("Delete income error:", err);
  }
}

// ===== BUDGET PROGRESS =====
async function loadBudgetProgress(month) {
  try {
    const [budRes, sumRes] = await Promise.all([
      authFetch(`${API}/budgets?month=${month}`),
      authFetch(`${API}/expenses/summary?month=${month}`),
    ]);
    if (!budRes || !sumRes) return;

    const budgets = await budRes.json();
    const summary = await sumRes.json();

    const spendMap = {};
    (summary.breakdown || []).forEach(
      (b) => (spendMap[b.category] = parseFloat(b.total)),
    );

    const container = document.getElementById("budgetProgress");
    if (!budgets.length) {
      container.innerHTML =
        '<div class="empty-state">No budgets set yet. Click "+ Set Budget" to start.</div>';
      return;
    }
    container.innerHTML = budgets
      .map((b) => {
        const spent = spendMap[b.category] || 0;
        const limit = parseFloat(b.monthly_limit);
        const pct = Math.min(Math.round((spent / limit) * 100), 100);
        const cls =
          pct < 70
            ? "progress-safe"
            : pct < 90
              ? "progress-warning"
              : "progress-danger";
        return `
        <div class="budget-item">
          <div class="budget-header">
            <span class="budget-category">${b.category}</span>
            <span class="budget-amounts">${formatCurrency(spent)} / ${formatCurrency(limit)}</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${cls}" style="width:${pct}%"></div>
          </div>
          <div class="progress-label">
            <span>${pct}% used</span>
            <span>${formatCurrency(limit - spent)} left</span>
          </div>
        </div>
      `;
      })
      .join("");
  } catch (err) {
    console.error("Budget progress error:", err);
  }
}

// ===== ADD EXPENSE =====
async function addExpense(e) {
  e.preventDefault();
  const btn = document.getElementById("addExpenseBtn");
  btn.textContent = "Adding...";
  btn.disabled = true;

  try {
    const res = await authFetch(`${API}/expenses`, {
      method: "POST",
      body: JSON.stringify({
        amount: document.getElementById("expAmount").value,
        category: document.getElementById("expCategory").value,
        description: document.getElementById("expDesc").value,
        date: document.getElementById("expDate").value,
      }),
    });
    if (res && res.ok) {
      document.getElementById("addExpenseForm").reset();
      document.getElementById("expDate").valueAsDate = new Date();
      await loadDashboard();
    }
  } catch (err) {
    console.error("Add expense error:", err);
  } finally {
    btn.textContent = "Add Expense";
    btn.disabled = false;
  }
}

// ===== DELETE EXPENSE =====
async function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;
  try {
    const res = await authFetch(`${API}/expenses/${id}`, { method: "DELETE" });
    if (res && res.ok) await loadDashboard();
  } catch (err) {
    console.error("Delete expense error:", err);
  }
}

// ===== BUDGET MODAL =====
function openBudgetModal() {
  document.getElementById("budgetModal").classList.remove("hidden");
  document.getElementById("modalOverlay").classList.remove("hidden");
}
function closeBudgetModal() {
  document.getElementById("budgetModal").classList.add("hidden");
  document.getElementById("modalOverlay").classList.add("hidden");
}

async function saveBudget(e) {
  e.preventDefault();
  try {
    const res = await authFetch(`${API}/budgets`, {
      method: "POST",
      body: JSON.stringify({
        category: document.getElementById("budgetCategory").value,
        monthly_limit: document.getElementById("budgetLimit").value,
        month: monthPicker.value,
      }),
    });
    if (res && res.ok) {
      closeBudgetModal();
      await loadBudgetProgress(monthPicker.value);
    }
  } catch (err) {
    console.error("Save budget error:", err);
  }
}

// ===== SIDEBAR & LOGOUT =====
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ===== INIT =====
loadDashboard();
