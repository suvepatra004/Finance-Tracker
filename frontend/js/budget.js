const API = "https://finance-tracker-guaj.onrender.com/api";

const token = localStorage.getItem("token");
if (!token) window.location.href = "index.html";

document.getElementById("userName").textContent =
  localStorage.getItem("userName") || "User";
document.getElementById("userAvatar").textContent = (localStorage.getItem(
  "userName",
) || "U")[0].toUpperCase();

const budgetMonthPicker = document.getElementById("budgetMonthPicker");
budgetMonthPicker.value = new Date().toISOString().slice(0, 7);

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

// ===== SAVE BUDGET =====
async function saveBudget(e) {
  e.preventDefault();
  const btn = document.getElementById("saveBudgetBtn");
  btn.textContent = "Saving...";
  btn.disabled = true;

  try {
    const res = await authFetch(`${API}/budgets`, {
      method: "POST",
      body: JSON.stringify({
        category: document.getElementById("budgetCategory").value,
        monthly_limit: document.getElementById("budgetLimit").value,
        month: budgetMonthPicker.value,
      }),
    });
    if (res && res.ok) {
      document.getElementById("setBudgetForm").reset();
      await loadBudgets();
    }
  } catch (err) {
    console.error("Save budget error:", err);
  } finally {
    btn.textContent = "Save Budget";
    btn.disabled = false;
  }
}

// ===== LOAD BUDGETS WITH SPENDING =====
async function loadBudgets() {
  const month = budgetMonthPicker.value;

  // Update label
  const [year, m] = month.split("-");
  const label = new Date(year, m - 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  document.getElementById("budgetMonthLabel").textContent = label;

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

    const container = document.getElementById("budgetList");

    if (!budgets.length) {
      container.innerHTML =
        '<div class="empty-state">No budgets set for this month. Use the form to add one.</div>';
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
            <button class="btn-delete" style="padding:3px 8px;font-size:0.75rem" onclick="deleteBudget(${b.id})">🗑</button>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-secondary);margin-bottom:8px">
            <span>Spent: ${formatCurrency(spent)}</span>
            <span>Limit: ${formatCurrency(limit)}</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${cls}" style="width:${pct}%"></div>
          </div>
          <div class="progress-label">
            <span>${pct}% used</span>
            <span>${formatCurrency(Math.max(limit - spent, 0))} left</span>
          </div>
        </div>
      `;
      })
      .join("");
  } catch (err) {
    console.error("Load budgets error:", err);
  }
}

// ===== DELETE BUDGET =====
async function deleteBudget(id) {
  if (!confirm("Delete this budget?")) return;
  try {
    const res = await authFetch(`${API}/budgets/${id}`, { method: "DELETE" });
    if (res && res.ok) await loadBudgets();
  } catch (err) {
    console.error("Delete budget error:", err);
  }
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ===== INIT =====
loadBudgets();
