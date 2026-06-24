// ── URL e serverit Express ─────────────────────────────────────────────────
// Go Live (VS Code) shërben HTML në :5500, Express API xhiron në :3000
const API_BASE = 'http://localhost:3000';

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtMonth(raw) {
  const d = new Date(raw);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function hideStatus(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.classList.add('error'); }
}

// ── Chart.js defaults ──────────────────────────────────────────────────────
Chart.defaults.color = '#7b7f96';
Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif";

const GRID_COLOR = 'rgba(42,45,58,0.8)';
const TICK_COLOR = '#7b7f96';

function baseScales(yLabel) {
  return {
    x: {
      grid: { color: GRID_COLOR },
      ticks: { color: TICK_COLOR, maxTicksLimit: 8 },
    },
    y: {
      grid: { color: GRID_COLOR },
      ticks: { color: TICK_COLOR },
      title: { display: true, text: yLabel, color: TICK_COLOR, font: { size: 11 } },
    },
  };
}

// ── Revenue Growth ─────────────────────────────────────────────────────────
fetch(`${API_BASE}/api/revenue-growth`)
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(data => {
    if (!data.length) { showError('revenueStatus', 'Nuk ka të dhëna.'); return; }
    hideStatus('revenueStatus');

    const labels = data.map(row => `${row.business_name} ${fmtMonth(row.month)}`);
    const values = data.map(row => parseFloat(row.total_revenue));

    new Chart(document.getElementById('revenueGrowthChart'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Revenue ($)',
          data: values,
          borderColor: '#6c63ff',
          backgroundColor: 'rgba(108,99,255,0.12)',
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.35,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` $${ctx.parsed.y.toLocaleString()}` } },
        },
        scales: baseScales('Revenue ($)'),
      },
    });
  })
  .catch(err => {
    console.error('Revenue Growth fetch error:', err);
    showError('revenueStatus', 'Gabim gjatë ngarkimit të të dhënave.');
  });

// ── Inventory Turnover ─────────────────────────────────────────────────────
fetch(`${API_BASE}/api/inventory-turnover`)
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(data => {
    if (!data.length) { showError('inventoryStatus', 'Nuk ka të dhëna.'); return; }
    hideStatus('inventoryStatus');

    const labels = data.map(row => `${row.business_name} - ${row.product_name}`);
    const values = data.map(row => parseFloat(row.turnover_ratio));

    new Chart(document.getElementById('inventoryTurnoverChart'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Turnover Ratio',
          data: values,
          backgroundColor: 'rgba(0,212,170,0.25)',
          borderColor: '#00d4aa',
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y.toFixed(2)}×` } },
        },
        scales: baseScales('Turnover Ratio (×)'),
      },
    });
  })
  .catch(err => {
    console.error('Inventory Turnover fetch error:', err);
    showError('inventoryStatus', 'Gabim gjatë ngarkimit të të dhënave.');
  });