const i18n = {
  en: {
    title: "Revenue Command Center",
    subtitle: "Deep filters, instant insights, and visual answers for every transaction.",
    kpi_1_label: "Total volume",
    kpi_2_label: "Avg transaction",
    kpi_3_label: "Last update",
    pulse: "Live pulse",
    active: "Active filters",
    records: "Records",
    filters: "Filters",
    filters_sub: "Build any segment in seconds.",
    apply: "Apply",
    reset: "Reset",
    search: "Search",
    search_ph: "Account, category, merchant",
    period: "Period (dd/mm/yy)",
    last_tx: "Last transaction (dd/mm/yy)",
    amount: "Amount",
    volume: "Volume",
    from: "From",
    to: "To",
    min: "Min",
    max: "Max",
    category: "Category",
    status: "Status",
    type: "Type",
    rows: "Rows",
    chart_volume_day: "Volume by day",
    chart_volume_cat: "Volume by category",
    chart_status: "Status split",
    transactions: "Transactions",
    load_more: "View more",
    invalid_date: "Invalid date. Use dd/mm/yyyy.",
    invalid_range: "Invalid range. Check the start and end dates.",
    th_account: "Account",
    th_category: "Category",
    th_status: "Status",
    th_type: "Type",
    th_amount: "Amount",
    th_volume: "Volume",
    th_date: "Date"
  },
  ru: {
    title: "Центр управления выручкой",
    subtitle: "Глубокие фильтры, быстрые инсайты и ответы на любые вопросы.",
    kpi_1_label: "Итоговый объём",
    kpi_2_label: "Средняя транзакция",
    kpi_3_label: "Последнее обновление",
    pulse: "Живой пульс",
    active: "Активные фильтры",
    records: "Записей",
    filters: "Фильтры",
    filters_sub: "Сегментируй данные за секунды.",
    apply: "Применить",
    reset: "Сбросить",
    search: "Поиск",
    search_ph: "Аккаунт, категория, продавец",
    period: "Период (dd/mm/yy)",
    last_tx: "Последняя транзакция (dd/mm/yy)",
    amount: "Сумма",
    volume: "Объём",
    from: "С",
    to: "По",
    min: "Мин",
    max: "Макс",
    category: "Категория",
    status: "Статус",
    type: "Тип",
    rows: "Строк",
    chart_volume_day: "Объём по дням",
    chart_volume_cat: "Объём по категориям",
    chart_status: "Статусы",
    transactions: "Транзакции",
    load_more: "Смотреть ещё",
    invalid_date: "Некорректная дата. Формат dd/mm/yyyy.",
    invalid_range: "Некорректный диапазон. Проверь даты «с» и «по».",
    th_account: "Аккаунт",
    th_category: "Категория",
    th_status: "Статус",
    th_type: "Тип",
    th_amount: "Сумма",
    th_volume: "Объём",
    th_date: "Дата"
  }
};

let lang = localStorage.getItem("nova-lang") || "ru";
let charts = {};
let currentSort = { key: "amount", dir: "desc" };
let visibleRows = 10;
const chartPalette = {
  teal: "#3bd4c3",
  blue: "#5aa2ff",
  amber: "#f4b25a",
  violet: "#8b8dff",
  slate: "#8e9bb3"
};

const crosshairPlugin = {
  id: "crosshairPlugin",
  afterDraw(chart) {
    const tooltip = chart.tooltip;
    if (!tooltip || !tooltip.getActiveElements || tooltip.getActiveElements().length === 0) return;

    const ctx = chart.ctx;
    const active = tooltip.getActiveElements()[0];
    const { x, y } = active.element;
    const { top, bottom, left, right } = chart.chartArea;

    ctx.save();
    ctx.strokeStyle = "rgba(90, 162, 255, 0.6)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();

    ctx.restore();
  }
};

const numberFormat = (value) =>
  new Intl.NumberFormat(lang === "ru" ? "ru-RU" : "en-US", {
    maximumFractionDigits: 2
  }).format(value);

const dateFormat = (value) => {
  const d = new Date(value);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
};

const applyI18n = () => {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (i18n[lang][key]) el.textContent = i18n[lang][key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (i18n[lang][key]) el.setAttribute("placeholder", i18n[lang][key]);
  });
  document.getElementById("lang-toggle").textContent = lang === "ru" ? "EN" : "RU";
  document.body.classList.toggle("lang-en", lang === "en");
};

const showFilterError = (message) => {
  const el = document.getElementById("filters-error");
  if (!el) return;
  el.textContent = message || "";
};

const clearInputErrors = () => {
  ["dateFrom", "dateTo", "lastTxFrom", "lastTxTo"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("input-error");
  });
};

const parseDateInput = (value) => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return null;
  const [d, m, y] = value.split("/").map(Number);
  if (y < 2000 || y > 2100) return null;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() + 1 !== m || dt.getDate() !== d) return null;
  return dt;
};

const validateDateFilters = () => {
  clearInputErrors();
  showFilterError("");

  const ids = ["dateFrom", "dateTo", "lastTxFrom", "lastTxTo"];
  let valid = true;

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el || !el.value) return;
    if (!parseDateInput(el.value)) {
      valid = false;
      el.classList.add("input-error");
      el.setCustomValidity(i18n[lang].invalid_date);
    } else {
      el.setCustomValidity("");
    }
  });

  const dateFrom = document.getElementById("dateFrom").value;
  const dateTo = document.getElementById("dateTo").value;
  const lastTxFrom = document.getElementById("lastTxFrom").value;
  const lastTxTo = document.getElementById("lastTxTo").value;

  if (dateFrom && dateTo && parseDateInput(dateFrom) > parseDateInput(dateTo)) {
    valid = false;
    document.getElementById("dateFrom").classList.add("input-error");
    document.getElementById("dateTo").classList.add("input-error");
    showFilterError(i18n[lang].invalid_range);
  }

  if (lastTxFrom && lastTxTo && parseDateInput(lastTxFrom) > parseDateInput(lastTxTo)) {
    valid = false;
    document.getElementById("lastTxFrom").classList.add("input-error");
    document.getElementById("lastTxTo").classList.add("input-error");
    showFilterError(i18n[lang].invalid_range);
  }

  if (!valid && !document.getElementById("filters-error").textContent) {
    showFilterError(i18n[lang].invalid_date);
  }

  return valid;
};

const buildData = () => {
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
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - (29 - i)),
      total: 0
    });
  }

  for (let i = 0; i < 180; i++) {
    const date = new Date(today.getTime() - Math.random() * 1000 * 60 * 60 * 24 * 30);
    const amount = Number((50 + Math.random() * 5000).toFixed(2));
    const volume = Number((amount * (0.6 + Math.random() * 2.2)).toFixed(2));
    const category = categories[Math.floor(Math.random() * categories.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const type = types[Math.floor(Math.random() * types.length)];

    rows.push({
      accountName: `Account ${Math.floor(100 + Math.random() * 900)}`,
      category,
      status,
      type,
      amount,
      volume,
      transactionDate: date
    });

    const dayIndex = Math.max(
      0,
      Math.min(29, 29 - Math.floor((today - date) / (1000 * 60 * 60 * 24)))
    );
    volumeByDay[dayIndex].total += volume;
    volumeByCategory.find((x) => x.category === category).total += volume;
    byStatus.find((x) => x.status === status).count += 1;
  }

  return { rows, volumeByDay, volumeByCategory, byStatus, categories, statuses, types };
};

const applyOptions = (id, items) => {
  const select = document.getElementById(id);
  if (!select) return;
  const current = select.value;
  select.innerHTML = `<option value="">${lang === "ru" ? "Все" : "All"}</option>`;
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    select.appendChild(option);
  });
  if (current) select.value = current;
};

const renderCharts = (data) => {
  if (charts.sparkline) charts.sparkline.destroy();
  charts.sparkline = new Chart(document.getElementById("sparkline"), {
    type: "line",
    data: {
      labels: data.volumeByDay.map((x) => dateFormat(x.date)),
      datasets: [
        {
          data: data.volumeByDay.map((x) => x.total),
          borderColor: "#6cf6ff",
          backgroundColor: "rgba(108, 246, 255, 0.2)",
          pointRadius: 3,
          pointHoverRadius: 4,
          pointBackgroundColor: "#0b0f14",
          pointBorderColor: "rgba(255, 255, 255, 0.5)",
          pointBorderWidth: 1.5,
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { x: { display: false }, y: { display: false } }
    }
  });

  if (charts.line) charts.line.destroy();
  charts.line = new Chart(document.getElementById("chart-volume-day"), {
    type: "line",
    data: {
      labels: data.volumeByDay.map((x) => dateFormat(x.date)),
      datasets: [
        {
          label: i18n[lang].chart_volume_day,
          data: data.volumeByDay.map((x) => x.total),
          borderColor: chartPalette.violet,
          backgroundColor: "rgba(139, 141, 255, 0.2)",
          tension: 0.35,
          fill: true
        }
      ]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: {
            color: chartPalette.slate,
            maxRotation: 0,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8
          },
          grid: { color: "rgba(255,255,255,0.04)" }
        },
        y: { ticks: { color: chartPalette.slate }, grid: { color: "rgba(255,255,255,0.04)" } }
      },
      interaction: {
        mode: "index",
        intersect: false
      }
    },
    plugins: [crosshairPlugin]
  });

  if (charts.bar) charts.bar.destroy();
  charts.bar = new Chart(document.getElementById("chart-volume-cat"), {
    type: "bar",
    data: {
      labels: data.volumeByCategory.map((x) => x.category),
      datasets: [
        {
          data: data.volumeByCategory.map((x) => x.total),
          backgroundColor: [
            "rgba(244, 178, 90, 0.95)",
            "rgba(90, 162, 255, 0.9)",
            "rgba(59, 212, 195, 0.9)",
            "rgba(139, 141, 255, 0.9)",
            "rgba(244, 178, 90, 0.75)",
            "rgba(90, 162, 255, 0.75)"
          ],
          borderRadius: 10,
          borderSkipped: false,
          barThickness: 22,
          hoverBackgroundColor: [
            "rgba(244, 178, 90, 1)",
            "rgba(90, 162, 255, 1)",
            "rgba(59, 212, 195, 1)",
            "rgba(139, 141, 255, 1)",
            "rgba(244, 178, 90, 0.9)",
            "rgba(90, 162, 255, 0.9)"
          ]
        }
      ]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: chartPalette.slate }, grid: { display: false } },
        y: { ticks: { color: chartPalette.slate }, grid: { color: "rgba(255,255,255,0.04)" } }
      }
    }
  });

  if (charts.donut) charts.donut.destroy();
  charts.donut = new Chart(document.getElementById("chart-status"), {
    type: "doughnut",
    data: {
      labels: data.byStatus.map((x) => x.status),
      datasets: [
        {
          data: data.byStatus.map((x) => x.count),
          backgroundColor: [
            chartPalette.blue,
            chartPalette.violet,
            chartPalette.amber,
            chartPalette.teal
          ],
          borderColor: "#111821",
          borderWidth: 2
        }
      ]
    },
    options: {
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: chartPalette.slate,
            usePointStyle: true,
            pointStyle: "circle",
            padding: 14,
            boxWidth: 8,
            boxHeight: 8
          }
        }
      }
    }
  });

  renderCategoryMiniList(data.volumeByCategory);
};

const renderCategoryMiniList = (items) => {
  const wrap = document.getElementById("category-mini-list");
  if (!wrap) return;
  const total = items.reduce((acc, item) => acc + item.total, 0);
  const colors = [
    "rgba(244, 178, 90, 0.95)",
    "rgba(90, 162, 255, 0.9)",
    "rgba(59, 212, 195, 0.9)"
  ];

  const top = [...items].sort((a, b) => b.total - a.total).slice(0, 3);
  wrap.innerHTML = "";
  top.forEach((item, idx) => {
    const percent = total ? ((item.total / total) * 100).toFixed(1) : "0.0";
    const delta = (Math.random() * 12 - 6).toFixed(1);
    const trendClass = Number(delta) >= 0 ? "up" : "down";
    const arrow = Number(delta) >= 0 ? "&uarr;" : "&darr;";

    const row = document.createElement("div");
    row.className = "mini-item";
    row.innerHTML = `
      <div class="mini-left">
        <span class="mini-dot" style="background:${colors[idx]}"></span>
        <span class="mini-name">${item.category}</span>
      </div>
      <div class="mini-meta">
        <span>${percent}%</span>
        <span class="mini-trend ${trendClass}">${arrow} ${Math.abs(delta)}%</span>
      </div>
    `;
    wrap.appendChild(row);
  });
};

const renderTable = (rows) => {
  const tbody = document.getElementById("table-body");
  tbody.innerHTML = "";
  rows.slice(0, visibleRows).forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.accountName}</td>
      <td>${row.category}</td>
      <td>${row.status}</td>
      <td>${row.type}</td>
      <td>${numberFormat(row.amount)}</td>
      <td>${numberFormat(row.volume)}</td>
      <td>${dateFormat(row.transactionDate)}</td>
    `;
    tbody.appendChild(tr);
  });
  document.getElementById("table-count").textContent = `${Math.min(visibleRows, rows.length)} / ${rows.length}`;
  const btn = document.getElementById("load-more");
  if (btn) {
    btn.style.display = rows.length > visibleRows ? "inline-flex" : "none";
  }
};

const updateKpis = (rows) => {
  const totalVolume = rows.reduce((acc, r) => acc + r.volume, 0);
  const avg = rows.reduce((acc, r) => acc + r.amount, 0) / rows.length;
  document.getElementById("kpi-volume").textContent = `$${numberFormat(totalVolume)}`;
  document.getElementById("kpi-avg").textContent = `$${numberFormat(avg)}`;
  document.getElementById("kpi-last").textContent = dateFormat(new Date());
  document.getElementById("records-count").textContent = rows.length.toString();
};

const countFilters = () => {
  const ids = [
    "search",
    "dateFrom",
    "dateTo",
    "lastTxFrom",
    "lastTxTo",
    "minVolume",
    "maxVolume",
    "minAmount",
    "maxAmount",
    "category",
    "status",
    "type"
  ];
  return ids.reduce((acc, id) => {
    const el = document.getElementById(id);
    return acc + (el && el.value ? 1 : 0);
  }, 0);
};

const applyFilters = (data) => {
  const search = document.getElementById("search").value.toLowerCase();
  const dateFrom = document.getElementById("dateFrom").value;
  const dateTo = document.getElementById("dateTo").value;
  const lastTxFrom = document.getElementById("lastTxFrom").value;
  const lastTxTo = document.getElementById("lastTxTo").value;
  const minVolume = parseFloat(document.getElementById("minVolume").value);
  const maxVolume = parseFloat(document.getElementById("maxVolume").value);
  const minAmount = parseFloat(document.getElementById("minAmount").value);
  const maxAmount = parseFloat(document.getElementById("maxAmount").value);
  const category = document.getElementById("category").value;
  const status = document.getElementById("status").value;
  const type = document.getElementById("type").value;
  const take = parseInt(document.getElementById("take").value, 10) || 100;

  let rows = data.rows.filter((row) => {
    const matchSearch =
      !search ||
      row.accountName.toLowerCase().includes(search) ||
      row.category.toLowerCase().includes(search);
    const dateFromParsed = dateFrom ? parseDateInput(dateFrom) : null;
    const dateToParsed = dateTo ? parseDateInput(dateTo) : null;
    const lastTxFromParsed = lastTxFrom ? parseDateInput(lastTxFrom) : null;
    const lastTxToParsed = lastTxTo ? parseDateInput(lastTxTo) : null;

    const matchDateFrom = !dateFromParsed || new Date(row.transactionDate) >= dateFromParsed;
    const matchDateTo =
      !dateToParsed ||
      new Date(row.transactionDate) <
        new Date(dateToParsed).setDate(dateToParsed.getDate() + 1);
    const matchLastFrom = !lastTxFromParsed || new Date(row.transactionDate) >= lastTxFromParsed;
    const matchLastTo =
      !lastTxToParsed ||
      new Date(row.transactionDate) <
        new Date(lastTxToParsed).setDate(lastTxToParsed.getDate() + 1);
    const matchMinVolume = !minVolume || row.volume >= minVolume;
    const matchMaxVolume = !maxVolume || row.volume <= maxVolume;
    const matchMinAmount = !minAmount || row.amount >= minAmount;
    const matchMaxAmount = !maxAmount || row.amount <= maxAmount;
    const matchCategory = !category || row.category === category;
    const matchStatus = !status || row.status === status;
    const matchType = !type || row.type === type;

    return (
      matchSearch &&
      matchDateFrom &&
      matchDateTo &&
      matchLastFrom &&
      matchLastTo &&
      matchMinVolume &&
      matchMaxVolume &&
      matchMinAmount &&
      matchMaxAmount &&
      matchCategory &&
      matchStatus &&
      matchType
    );
  });

  rows = sortRows(rows);
  rows = rows.slice(0, Math.min(take, rows.length));

  const reduced = {
    ...data,
    rows
  };

  updateKpis(rows);
  renderTable(rows);
  document.getElementById("active-filters").textContent = countFilters().toString();
  document.getElementById("segment-label").textContent =
    rows.length === data.rows.length ? (lang === "ru" ? "Все сегменты" : "All segments") : `${rows.length} rows`;

  const chartData = buildChartsFromRows(rows);
  renderCharts({
    ...data,
    volumeByDay: chartData.volumeByDay,
    volumeByCategory: chartData.volumeByCategory,
    byStatus: chartData.byStatus
  });

  return reduced;
};

const buildChartsFromRows = (rows) => {
  const volumeByDayMap = new Map();
  const volumeByCategoryMap = new Map();
  const byStatusMap = new Map();

  rows.forEach((row) => {
    const dayKey = new Date(row.transactionDate);
    const day = new Date(dayKey.getFullYear(), dayKey.getMonth(), dayKey.getDate()).toISOString();
    volumeByDayMap.set(day, (volumeByDayMap.get(day) || 0) + row.volume);
    volumeByCategoryMap.set(row.category, (volumeByCategoryMap.get(row.category) || 0) + row.volume);
    byStatusMap.set(row.status, (byStatusMap.get(row.status) || 0) + 1);
  });

  const volumeByDay = Array.from(volumeByDayMap.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const volumeByCategory = Array.from(volumeByCategoryMap.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const byStatus = Array.from(byStatusMap.entries()).map(([status, count]) => ({ status, count }));

  return { volumeByDay, volumeByCategory, byStatus };
};

const sortRows = (rows) => {
  const { key, dir } = currentSort;
  const sorted = [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av === bv) return 0;
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    if (av instanceof Date || bv instanceof Date) {
      return new Date(av) - new Date(bv);
    }
    if (typeof av === "number" && typeof bv === "number") {
      return av - bv;
    }
    return String(av).localeCompare(String(bv));
  });
  return dir === "desc" ? sorted.reverse() : sorted;
};

const bindSorting = () => {
  const headers = document.querySelectorAll("th[data-sort]");
  headers.forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      if (currentSort.key === key) {
        currentSort.dir = currentSort.dir === "asc" ? "desc" : "asc";
      } else {
        currentSort.key = key;
        currentSort.dir = "desc";
      }
      headers.forEach((h) => {
        h.classList.remove("is-active");
        h.removeAttribute("data-dir");
      });
      th.classList.add("is-active");
      th.setAttribute("data-dir", currentSort.dir);
      applyFilters(window.__dataCache);
    });
  });
};

const boot = () => {
  applyI18n();
  const data = buildData();
  window.__dataCache = data;
  applyOptions("category", data.categories);
  applyOptions("status", data.statuses);
  applyOptions("type", data.types);
  applyFilters(data);
  bindSorting();

  document.getElementById("apply").addEventListener("click", () => {
    if (!validateDateFilters()) return;
    visibleRows = 10;
    applyFilters(data);
  });
  document.getElementById("reset").addEventListener("click", () => {
    document.querySelectorAll(".filters input, .filters select").forEach((el) => (el.value = ""));
    document.getElementById("take").value = 100;
    visibleRows = 10;
    showFilterError("");
    clearInputErrors();
    applyFilters(data);
  });

  document.getElementById("lang-toggle").addEventListener("click", () => {
    lang = lang === "ru" ? "en" : "ru";
    localStorage.setItem("nova-lang", lang);
    applyI18n();
    applyFilters(data);
  });

  ["dateFrom", "dateTo", "lastTxFrom", "lastTxTo"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      const digits = el.value.replace(/\D/g, "").slice(0, 8);
      const parts = [];
      if (digits.length > 0) parts.push(digits.slice(0, 2));
      if (digits.length > 2) parts.push(digits.slice(2, 4));
      if (digits.length > 4) parts.push(digits.slice(4, 8));
      el.value = parts.join("/");
    });
    el.addEventListener("blur", () => validateDateFilters());
    el.addEventListener("change", () => validateDateFilters());
  });

  const loadMoreBtn = document.getElementById("load-more");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      visibleRows += 10;
      applyFilters(window.__dataCache);
    });
  }
};

document.addEventListener("DOMContentLoaded", boot);

