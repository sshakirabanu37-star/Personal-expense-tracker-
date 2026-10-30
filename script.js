const STORAGE_KEY = "pet_transactions_v1";
const BUDGET_KEY = "pet_budget_v1";
const THEME_KEY = "pet_theme_v1";
const CATEGORIES = {
Personal Expense Tracker | Page 7 expense: ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", 
"Education", "Other"],
 income: ["Salary", "Pocket Money", "Freelance", "Gift", "Other"]
};
const COLORS = ["#4f46e5", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#ec4899", "#8b5cf6",
"#64748b"];
/* ---------- State ---------- */
let transactions = loadJSON(STORAGE_KEY, []);
let budget = Number(localStorage.getItem(BUDGET_KEY)) || 0;
b) Validation – checks the title length, amount and date before saving and displays error messages next
to the fields.
/* ---------- Validation ---------- */
function validate() {
 let ok = true;
 [els.title, els.amount, els.date].forEach((i) => i.classList.remove("invalid"));
 els.titleErr.textContent = els.amountErr.textContent = els.dateErr.textContent = "";
 if (els.title.value.trim().length < 2) {
 els.titleErr.textContent = "Enter a title (min 2 characters)";
 els.title.classList.add("invalid"); ok = false;
 }
 const amt = parseFloat(els.amount.value);
 if (isNaN(amt) || amt <= 0) {
 els.amountErr.textContent = "Enter an amount greater than 0";
 els.amount.classList.add("invalid"); ok = false;
 }
 if (!els.date.value) {
 els.dateErr.textContent = "Select a date";
 els.date.classList.add("invalid"); ok = false;
 }
 return ok;
}
c) Add / update transaction – on form submit the data is validated, a new object is pushed to the array
(or the existing one is updated when editing), then the data is saved and the page is re-rendered.
form.addEventListener("submit", (e) => {
 e.preventDefault();
 if (!validate()) return;
 const data = {
 title: els.title.value.trim(),
 amount: parseFloat(parseFloat(els.amount.value).toFixed(2)),
 type: els.type.value,
 category: els.category.value,
 date: els.date.value
 };
 if (els.editId.value) {
 const idx = transactions.findIndex((t) => t.id === els.editId.value);
 if (idx > -1) transactions[idx] = { ...transactions[idx], ...data };
 showToast("Transaction updated "); ✔
 } else {
 transactions.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 
6), ...data });
Personal Expense Tracker | Page 8 showToast("Transaction added "); ✔
 }
 save();
 resetForm();
 render();
});
d) Delete – asks for confirmation, removes the record with Array.filter() and refreshes the display.
function deleteTx(id) {
 if (!confirm("Delete this transaction?")) return;
 transactions = transactions.filter((t) => t.id !== id);
 save();
 render();
 showToast("Transaction deleted");
}
e) Search, filter and sort – returns only the transactions that match the search text, type and category,
then sorts them by date or amount.
/* ---------- Filtering & sorting ---------- */
function getVisible() {
 const q = els.search.value.trim().toLowerCase();
 const type = els.filterType.value;
 const cat = els.filterCategory.value;
 let list = transactions.filter((t) =>
 (!q || t.title.toLowerCase().includes(q)) &&
 (type === "all" || t.type === type) &&
 (cat === "all" || t.category === cat)
 );
 const [field, dir] = els.sortBy.value.split("-");
 list.sort((a, b) => {
 const r = field === "date" ? a.date.localeCompare(b.date) : a.amount - b.amount;
 return dir === "asc" ? r : -r;
 });
 return list;
}
f) Rendering the table and summary – builds the HTML rows with template literals (escaping user
text to prevent HTML injection) and calculates totals using Array.filter() and Array.reduce().
function renderTable() {
 const list = getVisible();
 els.body.innerHTML = list.map((t) => `
 <tr>
 <td>${t.date}</td>
 <td>${escapeHTML(t.title)}</td>
 <td>${t.category}</td>
 <td><span class="badge ${t.type}">${t.type}</span></td>
 <td class="r amt-${t.type}">${t.type === "income" ? "+" : "-"}${money(t.amount)}</td>
 <td class="r">
 <button class="icon-btn" title="Edit" onclick="editTx('${t.id}')"> </button> ✏️
 <button class="icon-btn" title="Delete" onclick="deleteTx('${t.id}')"> </button> 🗑️
 </td>
 </tr>`).join("");
Personal Expense Tracker | Page 9 els.emptyMsg.classList.toggle("hidden", list.length > 0);
}
function renderSummary() {
 const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + 
t.amount, 0);
 const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + 
t.amount, 0);
 els.totalIncome.textContent = money(income);
 els.totalExpense.textContent = money(expense);
 els.balance.textContent = money(income - expense);
 els.balance.style.color = income - expense < 0 ? "var(--expense)" : "var(--primary)";
 renderBudget();
}
g) Donut chart – totals expenses per category and draws each slice as an arc on the canvas; a white
circle in the centre turns the pie into a donut and shows the total spent.
/* ---------- Donut chart (Canvas API, no library) ---------- */
function renderChart() {
 const totals = {};
 transactions.filter((t) => t.type === "expense")
 .forEach((t) => { totals[t.category] = (totals[t.category] || 0) + t.amount; });
 const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
 const total = entries.reduce((s, [, v]) => s + v, 0);
 const ctx = els.chart.getContext("2d");
 const w = els.chart.width, h = els.chart.height;
 ctx.clearRect(0, 0, w, h);
 els.chartEmpty.classList.toggle("hidden", total > 0);
 els.chart.classList.toggle("hidden", total === 0);
 els.legend.innerHTML = "";
 if (!total) return;
 const cx = w / 2, cy = h / 2, r = 135, inner = 80;
 let start = -Math.PI / 2;
 entries.forEach(([cat, val], i) => {
 const angle = (val / total) * Math.PI * 2;
 ctx.beginPath();
 ctx.moveTo(cx, cy);
 ctx.arc(cx, cy, r, start, start + angle);
 ctx.closePath();
 ctx.fillStyle = COLORS[i % COLORS.length];
 ctx.fill();
 start += angle;
 els.legend.insertAdjacentHTML("beforeend",
 `<li><span class="dot" style="background:${COLORS[i % COLORS.length]}"></span>${cat}
 <span class="amt">${((val / total) * 100).toFixed(0)}%</span></li>`);
 });
 // Cut out the centre to make a donut
 const bg = getComputedStyle(document.body).getPropertyValue("--panel").trim() || "#fff";
 ctx.beginPath();
 ctx.arc(cx, cy, inner, 0, Math.PI * 2);
 ctx.fillStyle = bg;
 ctx.fill();
Personal Expense Tracker | Page 10 ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--muted").trim();
 ctx.font = "14px Segoe UI, Arial";
 ctx.textAlign = "center";
 ctx.fillText("Total Spent", cx, cy - 8);
 ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--text").trim();
 ctx.font = "bold 20px Segoe UI, Arial";
 ctx.fillText(money(total), cx, cy + 20);
}
h) Export to CSV – converts transactions to comma-separated text, creates a Blob and triggers a
download.
/* ---------- Export CSV ---------- */
$("exportBtn").addEventListener("click", () => {
 if (!transactions.length) { showToast("Nothing to export"); return; }
 const rows = [["Date", "Title", "Category", "Type", "Amount"]];
 transactions.forEach((t) => rows.push([t.date, `"${t.title.replace(/"/g, '""')}"`, 
t.category, t.type, t.amount]));
 const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
 const a = document.createElement("a");
 a.href = URL.createObjectURL(blob);
 a.download = "expenses.csv";
 a.click();
 URL.revokeObjectURL(a.href);
 showToast("CSV exported "); ✔
});
