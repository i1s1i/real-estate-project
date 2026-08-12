/**
 * app.js - المنطق الرئيسي للتطبيق
 * AJAX fetches, property cards rendering, compare page charts
 */

// ── Property Type Labels ─────────────────────────────────────
const TYPE_LABELS = {
  villa: 'فيلا',
  apartment: 'شقة',
  land: 'أرض',
  commercial: 'تجاري',
};

// ── Format Price ─────────────────────────────────────────────
function formatPrice(price) {
  if (price >= 1_000_000) {
    return `${(price / 1_000_000).toFixed(1)} مليون ريال`;
  }
  return `${price.toLocaleString('ar-SA')} ريال`;
}

// ── Property Card HTML ────────────────────────────────────────
function buildPropertyCard(prop) {
  const imgFallback = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600';
  const badgeClass = prop.listing_type === 'sale' ? 'badge-sale' : 'badge-rent';
  const badgeText = prop.listing_type === 'sale' ? 'للبيع' : 'للإيجار';

  return `
    <div class="property-card card-lift" data-reveal>
      <div class="property-img">
        <img src="${prop.image_url || imgFallback}"
          alt="${prop.title}"
          onerror="this.src='${imgFallback}'"
          loading="lazy">
        <span class="badge ${badgeClass}">${badgeText}</span>
        ${prop.is_featured ? '<span class="badge badge-featured" style="top:1rem;left:1rem">⭐ مميز</span>' : ''}
      </div>
      <div class="property-info">
        <h3 class="property-title">${prop.title}</h3>
        <div class="property-price">${prop.price_formatted || formatPrice(prop.price)}</div>
        <div class="property-meta">
          ${prop.bedrooms ? `<span><i class="fas fa-bed"></i> ${prop.bedrooms} غرف</span>` : ''}
          ${prop.bathrooms ? `<span><i class="fas fa-bath"></i> ${prop.bathrooms} حمام</span>` : ''}
          ${prop.area_sqm ? `<span><i class="fas fa-ruler-combined"></i> ${prop.area_sqm} م²</span>` : ''}
        </div>
        ${prop.neighborhood_name ? `<p style="font-size:0.8rem;color:var(--color-text-secondary);margin-top:0.5rem"><i class="fas fa-map-marker-alt" style="color:var(--color-accent-primary)"></i> ${prop.neighborhood_name}</p>` : ''}
      </div>
    </div>
  `;
}

// ── Neighborhood Card Score Color ─────────────────────────────
function getScoreColor(score) {
  if (score >= 85) return '#10b981';
  if (score >= 70) return '#f59e0b';
  if (score >= 55) return '#f97316';
  return '#ef4444';
}

// ═══════════════════════════════════════════════════════════
// COMPARE PAGE
// ═══════════════════════════════════════════════════════════
let compareChartLine = null;
let compareChartBar = null;
const compareColors = ['#c9a84c', '#10b981', '#3b82f6', '#f97316'];

function renderCompareCards(neighborhoods) {
  const resultsEl = document.getElementById('compare-results');
  if (!resultsEl) return;

  if (!neighborhoods.length) {
    resultsEl.innerHTML = '<p class="text-muted text-center" style="padding:2rem">اختر حيين أو أكثر للمقارنة</p>';
    return;
  }

  resultsEl.innerHTML = neighborhoods.map((n, i) => {
    const color = compareColors[i];
    const score = n.infrastructure_score;
    const scoreColor = getScoreColor(score);

    return `
    <div class="compare-card" data-reveal data-reveal-delay="${i + 1}">
      <div class="compare-card-header">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <h3>${n.name_ar}</h3>
            <p class="text-muted" style="font-size:0.8rem">${n.name_en}</p>
          </div>
          <div class="score-ring" style="--score:${score};--score-color:${scoreColor}">
            <span class="score-value">${score}</span>
          </div>
        </div>
      </div>
      <div class="compare-card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
          <div>
            <p class="text-muted" style="font-size:0.75rem">سعر الأرض</p>
            <p style="font-weight:700;color:${color};font-size:0.95rem">${(n.land_price_per_sqm||0).toLocaleString('ar-SA')} ريال/م²</p>
          </div>
          <div>
            <p class="text-muted" style="font-size:0.75rem">متوسط الإيجار</p>
            <p style="font-weight:700;color:#10b981;font-size:0.95rem">${(n.avg_rent_per_sqm||0).toLocaleString('ar-SA')} ريال/م²</p>
          </div>
        </div>

        <div style="margin-bottom:1rem">
          <p class="text-muted" style="font-size:0.75rem;margin-bottom:0.5rem">البنية التحتية</p>
          <div class="progress-bar">
            <div class="progress-fill" data-width="${score}" style="background:${scoreColor};width:0"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--color-text-muted);margin-top:0.25rem">
            <span>0</span>
            <span style="color:${scoreColor};font-weight:700">${score}%</span>
            <span>100</span>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.5rem">
          ${buildInfoPill('🌳', 'الحدائق', n.parks_count)}
          ${buildInfoPill('🏥', 'المستشفيات', n.hospitals_count)}
          ${buildInfoPill('🏫', 'المدارس', n.schools_count)}
          ${buildInfoPill('🏬', 'المجمعات', n.malls_count)}
          ${buildInfoPill('🏗️', 'مساحة مبنية', n.built_area_pct + '%')}
          ${buildInfoPill('🛣️', 'مداخل طرق', n.highway_access)}
        </div>
      </div>
    </div>`;
  }).join('');

  // Animate progress bars
  setTimeout(() => {
    resultsEl.querySelectorAll('.progress-fill').forEach(fill => {
      fill.style.width = fill.dataset.width + '%';
    });
  }, 300);

  renderLineChart(neighborhoods);
  renderBarChart(neighborhoods);
}

function buildInfoPill(emoji, label, value) {
  return `<div class="stat-pill">${emoji} <span style="color:var(--color-text-primary);font-weight:600">${value}</span> ${label}</div>`;
}

// ── Line Chart: Price History ─────────────────────────────────
function renderLineChart(neighborhoods) {
  const ctx = document.getElementById('price-chart')?.getContext('2d');
  if (!ctx) return;

  if (compareChartLine) compareChartLine.destroy();

  const datasets = neighborhoods.map((n, i) => ({
    label: n.name_ar,
    data: n.price_history?.prices || [],
    borderColor: compareColors[i],
    backgroundColor: compareColors[i] + '22',
    tension: 0.4,
    fill: true,
    borderWidth: 2.5,
    pointBackgroundColor: compareColors[i],
    pointRadius: 4,
    pointHoverRadius: 7,
  }));

  const labels = neighborhoods[0]?.price_history?.labels || ['2020','2021','2022','2023','2024','2025'];

  compareChartLine = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { color: '#94a3b8', usePointStyle: true, pointStyle: 'circle', font: { family: 'Tajawal' } },
        },
        tooltip: {
          backgroundColor: '#1e293b',
          borderColor: '#c9a84c',
          borderWidth: 1,
          titleColor: '#f8fafc',
          bodyColor: '#94a3b8',
          titleFont: { family: 'Tajawal', weight: '700' },
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('ar-SA')} ريال`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#64748b', font: { family: 'Inter' } },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#64748b',
            font: { family: 'Inter' },
            callback: v => (v >= 1000 ? v.toLocaleString() : v),
          },
        },
      },
    },
  });
}

// ── Bar Chart: Infrastructure Comparison ─────────────────────
function renderBarChart(neighborhoods) {
  const ctx = document.getElementById('infra-chart')?.getContext('2d');
  if (!ctx) return;

  if (compareChartBar) compareChartBar.destroy();

  compareChartBar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['الحدائق', 'المستشفيات', 'المدارس', 'المجمعات', 'المقاهي'],
      datasets: neighborhoods.map((n, i) => ({
        label: n.name_ar,
        data: [n.parks_count, n.hospitals_count, n.schools_count, n.malls_count, n.cafes_count],
        backgroundColor: compareColors[i] + 'cc',
        borderColor: compareColors[i],
        borderWidth: 1.5,
        borderRadius: 6,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#94a3b8', font: { family: 'Tajawal' } },
        },
        tooltip: {
          backgroundColor: '#1e293b',
          borderColor: '#c9a84c',
          borderWidth: 1,
          titleColor: '#f8fafc',
          bodyColor: '#94a3b8',
          titleFont: { family: 'Tajawal', weight: '700' },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748b', font: { family: 'Tajawal' } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', stepSize: 1 } },
      },
    },
  });
}

// ── Compare Page Logic ────────────────────────────────────────
async function runCompare() {
  const selects = document.querySelectorAll('.compare-select');
  const ids = [...selects].map(s => s.value).filter(Boolean);

  if (ids.length < 2) {
    showToast('يرجى اختيار حيين على الأقل للمقارنة', 'error');
    return;
  }

  const resultsEl = document.getElementById('compare-results');
  if (resultsEl) resultsEl.innerHTML = '<div class="skeleton skeleton-card" style="height:250px"></div>'.repeat(ids.length);

  try {
    const params = ids.map(id => `ids=${id}`).join('&');
    const res = await fetch(`/api/neighborhoods/compare?${params}`);
    const data = await res.json();

    if (data.success) {
      renderCompareCards(data.data);
    }
  } catch (err) {
    console.error('Compare error:', err);
    showToast('حدث خطأ في جلب البيانات', 'error');
  }
}

// ── Homepage: Load Featured Properties via AJAX ─────────────
async function loadFeaturedProperties() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;

  showSkeletons(grid, 6);

  try {
    const res = await fetch('/api/properties/search');
    const data = await res.json();
    grid.innerHTML = '';
    if (data.success && data.data.length) {
      grid.innerHTML = data.data.slice(0, 6).map(buildPropertyCard).join('');
      // Re-observe new reveal elements
      grid.querySelectorAll('[data-reveal]').forEach(el => revealObserver?.observe(el));
    } else {
      grid.innerHTML = '<div class="empty-state"><i class="fas fa-home"></i><h3>لا توجد عقارات حالياً</h3><p>سيتم إضافة عقارات قريباً</p></div>';
    }
  } catch (err) {
    console.error('Error loading featured:', err);
  }
}

// ── Init Compare Page ─────────────────────────────────────────
const compareBtn = document.getElementById('compare-btn');
if (compareBtn) {
  compareBtn.addEventListener('click', runCompare);
}

// ── Init Featured on Homepage ─────────────────────────────────
if (document.getElementById('featured-grid')) {
  loadFeaturedProperties();
}

// ── Search Form Submit ─────────────────────────────────────────
const searchForm = document.getElementById('search-form');
if (searchForm) {
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const listing = searchForm.querySelector('[name="listing"]')?.value || '';
    const type = searchForm.querySelector('[name="type"]')?.value || '';
    const neighborhood = searchForm.querySelector('[name="neighborhood"]')?.value || '';
    let url = '/properties?';
    if (listing) url += `listing=${listing}&`;
    if (type) url += `type=${type}&`;
    if (neighborhood) url += `neighborhood=${neighborhood}`;
    window.location.href = url;
  });
}
