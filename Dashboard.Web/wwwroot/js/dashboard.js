const translations = {
  en: {
    title: "Financial Operations Dashboard",
    subtitle: "Search, filter, and build charts from transaction data.",
    updated: "Last updated",
    records: "Records",
    filters: "Filters",
    search_placeholder: "Account or category",
    date_from: "Date from",
    date_to: "Date to",
    last_tx_from: "Last transaction from",
    last_tx_to: "Last transaction to",
    min_volume: "Min volume",
    max_volume: "Max volume",
    min_amount: "Min amount",
    max_amount: "Max amount",
    category: "Category",
    status: "Status",
    type: "Type",
    rows: "Rows",
    charts: "Charts",
    chart_volume_day: "Volume by day",
    chart_volume_cat: "Volume by category",
    chart_status: "Status split",
    apply: "Apply filters",
    reset: "Reset",
    total_tx: "Total transactions",
    total_volume: "Total volume",
    avg_amount: "Avg amount",
    last_tx: "Last transaction",
    transactions: "Transactions",
    th_account: "Account",
    th_category: "Category",
    th_status: "Status",
    th_type: "Type",
    th_amount: "Amount",
    th_volume: "Volume",
    th_date: "Date",
    all: "All"
  },
  ru: {
    title: "Панель финансовых операций",
    subtitle: "Ищи, фильтруй и строй графики по транзакциям.",
    updated: "Обновлено",
    records: "Записей",
    filters: "Фильтры",
    search_placeholder: "Аккаунт или категория",
    date_from: "Дата с",
    date_to: "Дата по",
    last_tx_from: "Последняя транзакция с",
    last_tx_to: "Последняя транзакция по",
    min_volume: "Мин. объём",
    max_volume: "Макс. объём",
    min_amount: "Мин. сумма",
    max_amount: "Макс. сумма",
    category: "Категория",
    status: "Статус",
    type: "Тип",
    rows: "Строк",
    charts: "Графики",
    chart_volume_day: "Объём по дням",
    chart_volume_cat: "Объём по категориям",
    chart_status: "Статусы",
    apply: "Применить",
    reset: "Сбросить",
    total_tx: "Всего транзакций",
    total_volume: "Итоговый объём",
    avg_amount: "Средняя сумма",
    last_tx: "Последняя транзакция",
    transactions: "Транзакции",
    th_account: "Аккаунт",
    th_category: "Категория",
    th_status: "Статус",
    th_type: "Тип",
    th_amount: "Сумма",
    th_volume: "Объём",
    th_date: "Дата",
    all: "Все"
  }
};

let currentLang = localStorage.getItem("dashboard-lang") || "ru";
let lineChart = null;
let barChart = null;
let donutChart = null;

const formatNumber = (value) => {
  const locale = currentLang === "ru" ? "ru-RU" : "en-US";
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
};

const formatDate = (value) => {
  if (!value) return "—";
  const locale = currentLang === "ru" ? "ru-RU" : "en-US";
  return new Date(value).toLocaleDateString(locale);
};

const applyI18n = () => {
  const dict = translations[currentLang];
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) el.setAttribute("placeholder", dict[key]);
  });

  document.getElementById("lang-toggle").textContent = currentLang === "ru" ? "EN" : "RU";
};

const buildQuery = () => {
  const params = new URLSearchParams();
  const map = {
    search: "search",
    dateFrom: "dateFrom",
    dateTo: "dateTo",
    lastTxFrom: "lastTxFrom",
    lastTxTo: "lastTxTo",
    minVolume: "minVolume",
    maxVolume: "maxVolume",
    minAmount: "minAmount",
    maxAmount: "maxAmount",
    status: "status",
    category: "category",
    type: "type",
    take: "take"
  };

  Object.entries(map).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const value = el.value;
    if (value !== "" && value !== "all") params.set(key, value);
  });

  return params.toString();
};

const renderOptions = (selectId, values) => {
  const select = document.getElementById(selectId);
  if (!select) return;
  const selected = select.value;
  const dict = translations[currentLang];
  select.innerHTML = `<option value="all">${dict.all}</option>`;
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
  if (selected) select.value = selected;
};

const updateChartsVisibility = () => {
  document.getElementById("card-line").style.display = document.getElementById("chart-line").checked ? "block" : "none";
  document.getElementById("card-bar").style.display = document.getElementById("chart-bar").checked ? "block" : "none";
  document.getElementById("card-donut").style.display = document.getElementById("chart-donut").checked ? "block" : "none";
};

const renderCharts = (data) => {
  const labelsDay = data.volumeByDay.map((x) => formatDate(x.date));
  const dataDay = data.volumeByDay.map((x) => x.total);

  if (lineChart) lineChart.destroy();
  lineChart = new Chart(document.getElementById("chart-volume-day"), {
    type: "line",
    data: {
      labels: labelsDay,
      datasets: [
        {
          label: translations[currentLang].chart_volume_day,
          data: dataDay,
          borderColor: "#00d1b2",
          backgroundColor: "rgba(0, 209, 178, 0.2)",
          tension: 0.35,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });

  const labelsCat = data.volumeByCategory.map((x) => x.category);
  const dataCat = data.volumeByCategory.map((x) => x.total);
  if (barChart) barChart.destroy();
  barChart = new Chart(document.getElementById("chart-volume-cat"), {
    type: "bar",
    data: {
      labels: labelsCat,
      datasets: [
        {
          label: translations[currentLang].chart_volume_cat,
          data: dataCat,
          backgroundColor: "#ff9f1c"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });

  const labelsStatus = data.byStatus.map((x) => x.status);
  const dataStatus = data.byStatus.map((x) => x.count);
  if (donutChart) donutChart.destroy();
  donutChart = new Chart(document.getElementById("chart-status"), {
    type: "doughnut",
    data: {
      labels: labelsStatus,
      datasets: [
        {
          label: translations[currentLang].chart_status,
          data: dataStatus,
          backgroundColor: ["#2ec4b6", "#ff9f1c", "#e71d36", "#6c757d"]
        }
      ]
    },
    options: {
      responsive: true
    }
  });
};

const renderTable = (rows) => {
  const tbody = document.getElementById("table-body");
  tbody.innerHTML = "";
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.accountName}</td>
      <td>${row.category}</td>
      <td>${row.status}</td>
      <td>${row.type}</td>
      <td>${formatNumber(row.amount)}</td>
      <td>${formatNumber(row.volume)}</td>
      <td>${formatDate(row.transactionDate)}</td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById("table-count").textContent = rows.length.toString();
};

const updateSummary = (summary, totalRecords) => {
  document.getElementById("summary-total").textContent = formatNumber(summary.totalTransactions);
  document.getElementById("summary-volume").textContent = formatNumber(summary.totalVolume);
  document.getElementById("summary-avg").textContent = formatNumber(summary.avgAmount);
  document.getElementById("summary-last").textContent = formatDate(summary.lastTransactionDate);
  document.getElementById("records-count").textContent = formatNumber(totalRecords);
  document.getElementById("last-updated").textContent = formatDate(new Date());
};

const loadData = async () => {
  updateChartsVisibility();
  const query = buildQuery();
  let data = null;

  try {
    const response = await fetch(`/api/dashboard?${query}`);
    if (!response.ok) throw new Error("API error");
    data = await response.json();
  } catch (err) {
    data = buildFallbackData();
  }

  renderOptions("category", data.options.categories);
  renderOptions("status", data.options.statuses);
  renderOptions("type", data.options.types);

  updateSummary(data.summary, data.summary.totalTransactions);
  renderCharts(data.charts);
  renderTable(data.rows);
};

const buildFallbackData = () => {
  const random = (min, max) => Math.random() * (max - min) + min;
  const categories = ["Retail", "Logistics", "SaaS", "Marketing", "Payroll", "Ops"];
  const statuses = ["Completed", "Pending", "Failed", "Reversed"];
  const types = ["Credit", "Debit"];
  const rows = [];
  const volumeByDay = [];
  const volumeByCategory = categories.map((c) => ({ category: c, total: 0 }));
  const byStatus = statuses.map((s) => ({ status: s, count: 0 }));

  const today = new Date();
  for (let i = 0; i < 30; i++) {
    volumeByDay.push({
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - (29 - i)).toISOString(),
      total: 0
    });
  }

  for (let i = 0; i < 120; i++) {
    const date = new Date(today.getTime() - random(0, 1000 * 60 * 60 * 24 * 30));
    const amount = Number(random(50, 5000).toFixed(2));
    const volume = Number((amount * random(0.5, 2.5)).toFixed(2));
    const category = categories[Math.floor(random(0, categories.length))];
    const status = statuses[Math.floor(random(0, statuses.length))];
    const type = types[Math.floor(random(0, types.length))];

    rows.push({
      id: i + 1,
      accountName: `Account ${Math.floor(random(100, 999))}`,
      category,
      status,
      type,
      amount,
      volume,
      transactionDate: date.toISOString()
    });

    const dayIndex = Math.max(0, Math.min(29, 29 - Math.floor((today - date) / (1000 * 60 * 60 * 24))));
    volumeByDay[dayIndex].total += volume;
    volumeByCategory.find((x) => x.category === category).total += volume;
    byStatus.find((x) => x.status === status).count += 1;
  }

  const totalTransactions = rows.length;
  const totalVolume = rows.reduce((acc, r) => acc + r.volume, 0);
  const avgAmount = rows.reduce((acc, r) => acc + r.amount, 0) / totalTransactions;
  const lastTransactionDate = rows[0]?.transactionDate;

  return {
    summary: { totalTransactions, totalVolume, avgAmount, lastTransactionDate },
    charts: {
      volumeByDay,
      volumeByCategory,
      byStatus
    },
    rows,
    options: {
      categories,
      statuses,
      types
    }
  };
};

document.addEventListener("DOMContentLoaded", () => {
  applyI18n();
  loadData();

  document.getElementById("filters").addEventListener("submit", (e) => {
    e.preventDefault();
    loadData();
  });

  document.getElementById("reset").addEventListener("click", () => {
    document.getElementById("filters").reset();
    loadData();
  });

  document.getElementById("lang-toggle").addEventListener("click", () => {
    currentLang = currentLang === "ru" ? "en" : "ru";
    localStorage.setItem("dashboard-lang", currentLang);
    applyI18n();
    loadData();
  });

  ["chart-line", "chart-bar", "chart-donut"].forEach((id) => {
    document.getElementById(id).addEventListener("change", updateChartsVisibility);
  });
});
