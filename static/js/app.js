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
  const isSale = prop.listing_type === 'sale';
  const listingText = isSale ? 'للبيع' : 'للإيجار السنوي';
  const typeText = TYPE_LABELS[prop.property_type] || prop.property_type;

  return `
    <article class="property-card home-property-card">
      <div class="property-img">
        <img src="${prop.image_url || imgFallback}"
          alt="صورة توضيحية لعقار سكني"
          onerror="this.onerror=null;this.src='${imgFallback}'"
          loading="lazy">
      </div>
      <div class="property-info home-property-info">
        <p class="home-property-type">${typeText} · ${listingText}</p>
        <h3 class="property-title">${prop.title}</h3>
        <div class="property-price">${prop.price_formatted || formatPrice(prop.price)}</div>
        <p class="home-property-meta">
          ${prop.area_sqm ? `<span>${prop.area_sqm} م²</span>` : ''}
          ${prop.bedrooms ? `<span>${prop.bedrooms} غرف</span>` : ''}
          ${prop.neighborhood_name ? `<span>${prop.neighborhood_name}</span>` : ''}
        </p>
        <button type="button" class="home-details-button" onclick="openPropertyModalById(${prop.id})" aria-label="عرض تفاصيل ${prop.title}">
          <span>عرض التفاصيل</span>
          <i class="fas fa-arrow-left" aria-hidden="true"></i>
        </button>
      </div>
    </article>
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
let comparedNeighborhoods = [];

function renderCompareCards(neighborhoods) {
  const resultsEl = document.getElementById('compare-results');
  if (!resultsEl) return;
  comparedNeighborhoods = neighborhoods;

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
            <h3>${document.documentElement.lang === 'en' ? (n.name_en || n.name_ar) : n.name_ar}</h3>
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
            <div class="progress-fill" data-width="${score}" style="background:${scoreColor};width:${score}%"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--color-text-muted);margin-top:0.25rem">
            <span>0</span>
            <span style="color:${scoreColor};font-weight:700">${score}%</span>
            <span>100</span>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.5rem">
          ${buildInfoPill('🌳', formatPluralValue(n.parks_count, 'حديقة', 'حدائق'))}
          ${buildInfoPill('🏥', formatPluralValue(n.hospitals_count, 'مستشفى', 'مستشفيات'))}
          ${buildInfoPill('🏫', formatPluralValue(n.schools_count, 'مدرسة', 'مدارس'))}
          ${buildInfoPill('🏬', (n.malls_count || 0) + ' مجمعات')}
          ${buildInfoPill('🏗️', (n.built_area_pct || 0) + '% مساحة مبنية')}
          ${buildInfoPill('🛣️', (n.highway_access || '-') + ' مداخل طرق')}
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

function formatPluralValue(count, singular, plural) {
  count = parseInt(count, 10) || 0;
  if (count === 0) return `لا توجد ${plural}`;
  if (count === 1) return singular === 'مستشفى' ? 'مستشفى واحد' : singular === 'مدرسة' ? 'مدرسة واحدة' : 'حديقة واحدة';
  if (count === 2) return singular === 'مستشفى' ? 'مستشفيان' : singular === 'مدرسة' ? 'مدرستان' : 'حديقتان';
  if (count >= 3 && count <= 10) return `${count} ${plural}`;
  return `${count} ${singular}`;
}

function buildInfoPill(emoji, text) {
  return `<div class="stat-pill">${emoji} <span style="color:var(--color-text-primary);font-weight:600">${text}</span></div>`;
}

// ── Line Chart: Price History ─────────────────────────────────
function renderLineChart(neighborhoods) {
  const ctx = document.getElementById('price-chart')?.getContext('2d');
  if (!ctx) return;

  if (compareChartLine) compareChartLine.destroy();

  const datasets = neighborhoods.map((n, i) => ({
    label: document.documentElement.lang === 'en' ? (n.name_en || n.name_ar) : n.name_ar,
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
      resizeDelay: 200,
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
      labels: ['الحدائق', 'المستشفيات', 'المدارس', 'المجمعات', 'المقاهي'].map(window.translateForCurrentLanguage),
      datasets: neighborhoods.map((n, i) => ({
        label: document.documentElement.lang === 'en' ? (n.name_en || n.name_ar) : n.name_ar,
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
      resizeDelay: 200,
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

window.addEventListener('aqar-language-change', () => {
  if (comparedNeighborhoods.length) renderCompareCards(comparedNeighborhoods);
});

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

// ═══════════════════════════════════════════════════════════
// PROPERTY DETAILS MODAL SYSTEM
// ═══════════════════════════════════════════════════════════
let currentModalProperty = null;

async function openPropertyModalById(propId) {
  if (!propId) return;
  try {
    const res = await fetch(`/api/properties/${propId}`);
    const data = await res.json();
    if (data.success && data.data) {
      openPropertyModal(data.data);
    }
  } catch (err) {
    console.error('Error fetching property details:', err);
  }
}
window.openPropertyModalById = openPropertyModalById;

function openPropertyModal(prop) {
  currentModalProperty = prop;
  const modal = document.getElementById('propertyDetailsModal');
  if (!modal) return;

  const img = document.getElementById('modalPropertyImg');
  const title = document.getElementById('modalPropertyTitle');
  const location = document.getElementById('modalNeighborhoodName');
  const price = document.getElementById('modalPropertyPrice');
  const priceSubtitle = document.getElementById('modalPriceSubtitle');
  const listingBadge = document.getElementById('modalPropertyListingBadge');
  const typeBadge = document.getElementById('modalPropertyTypeBadge');
  const typeVal = document.getElementById('modalPropertyType');
  const listingVal = document.getElementById('modalPropertyListing');
  const areaVal = document.getElementById('modalPropertyArea');
  const meterVal = document.getElementById('modalPropertyMeterPrice');
  const bedVal = document.getElementById('modalPropertyBedrooms');
  const bathVal = document.getElementById('modalPropertyBathrooms');
  const desc = document.getElementById('modalPropertyDescription');
  const mapLink = document.getElementById('modalMapLink');

  if (img) img.src = prop.image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800';
  if (title) title.textContent = prop.title;
  if (location) location.textContent = (prop.neighborhood_name || 'شمال الرياض') + (prop.neighborhood_score ? ` (درجة البنية التحتية: ${prop.neighborhood_score}%)` : '');
  if (price) price.textContent = prop.price_formatted || (Number(prop.price).toLocaleString('ar-SA') + ' ريال');
  if (priceSubtitle) priceSubtitle.textContent = prop.listing_type === 'rent' ? 'قيمة الإيجار السنوي' : 'سعر الشراء الإجمالي';

  const isSale = prop.listing_type === 'sale';
  if (listingBadge) {
    listingBadge.className = `badge ${isSale ? 'badge-sale' : 'badge-rent'}`;
    listingBadge.textContent = isSale ? '🏷️ للبيع' : '🔑 للإيجار السنوي';
  }
  if (typeBadge) {
    typeBadge.textContent = prop.property_type_ar || TYPE_LABELS[prop.property_type] || prop.property_type;
  }

  if (typeVal) typeVal.innerHTML = `<i class="fas fa-home" style="color:var(--color-accent-primary)"></i> ${prop.property_type_ar || TYPE_LABELS[prop.property_type] || prop.property_type}`;
  if (listingVal) listingVal.innerHTML = `<i class="fas fa-tag" style="color:var(--color-accent-primary)"></i> ${isSale ? 'للبيع' : 'للإيجار السنوي'}`;
  if (areaVal) areaVal.innerHTML = `<i class="fas fa-ruler-combined" style="color:var(--color-accent-primary)"></i> ${prop.area_sqm || '-'} م²`;
  if (meterVal) meterVal.innerHTML = `<i class="fas fa-chart-line" style="color:var(--color-accent-primary)"></i> ${prop.price_per_sqm ? Number(prop.price_per_sqm).toLocaleString('ar-SA') + ' ريال/م²' : '-'}`;
  if (bedVal) bedVal.innerHTML = `<i class="fas fa-bed" style="color:var(--color-accent-primary)"></i> ${prop.bedrooms ? prop.bedrooms + ' غرف' : 'غير متوفر'}`;
  if (bathVal) bathVal.innerHTML = `<i class="fas fa-bath" style="color:var(--color-accent-primary)"></i> ${prop.bathrooms ? prop.bathrooms + ' حمام' : 'غير متوفر'}`;
  if (desc) desc.textContent = prop.description || 'عقار مميز بموقع استراتيجي بالقرب من الخدمات والمرافق الرئيسية في الرياض.';

  if (mapLink) {
    mapLink.href = `/map?prop_id=${prop.id}`;
    mapLink.onclick = (e) => {
      if (window.location.pathname.includes('/map')) {
        e.preventDefault();
        closePropertyModal();
        if (typeof flyToPropertyId === 'function') {
          flyToPropertyId(prop.id);
        } else if (prop.lat && prop.lng && typeof flyToProperty === 'function') {
          flyToProperty(prop.lat, prop.lng);
        }
      }
    };
  }

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
window.openPropertyModal = openPropertyModal;

function closePropertyModal() {
  const modal = document.getElementById('propertyDetailsModal');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
}
window.closePropertyModal = closePropertyModal;

function sharePropertyDetails() {
  if (!currentModalProperty) return;
  const url = window.location.origin + `/map?prop_id=${currentModalProperty.id}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url);
    if (window.showToast) window.showToast('تم نسخ رابط العقار إلى الحافظة بنجاح ✅');
  } else {
    alert('رابط العقار: ' + url);
  }
}
window.sharePropertyDetails = sharePropertyDetails;

function simulateContactAgent() {
  if (window.showToast) {
    window.showToast('تم إرسال طلب استفسار للوسيط العقاري المعتمد بنجاح 📞');
  } else {
    alert('تم إرسال طلب استفسار للوسيط العقاري المعتمد بنجاح!');
  }
}
window.simulateContactAgent = simulateContactAgent;

// ═══════════════════════════════════════════════════════════
// AI ASSISTANT (RAG ADVISOR) CHAT INTERFACE
// ═══════════════════════════════════════════════════════════
let aiChatSending = false;

function getAIChatLanguage() {
  return document.documentElement.lang === 'en' ? 'en' : 'ar';
}

function aiChatText(arabic, english) {
  return getAIChatLanguage() === 'en' ? english : arabic;
}

function setAIChatOpen(isOpen) {
  const drawer = document.getElementById('aiChatDrawer');
  const trigger = document.getElementById('aiAdvisorFab');
  if (!drawer) return;

  drawer.classList.toggle('open', isOpen);
  drawer.setAttribute('aria-hidden', String(!isOpen));
  trigger?.setAttribute('aria-expanded', String(isOpen));
  if (isOpen) {
    const input = document.getElementById('aiChatInput');
    window.setTimeout(() => input?.focus(), 350);
  } else {
    trigger?.focus();
  }
}

function toggleAIChat() {
  const drawer = document.getElementById('aiChatDrawer');
  if (drawer) setAIChatOpen(!drawer.classList.contains('open'));
}
window.toggleAIChat = toggleAIChat;

function sendQuickPrompt(arabicPrompt, englishPrompt) {
  const input = document.getElementById('aiChatInput');
  if (!input || aiChatSending) return;
  input.value = getAIChatLanguage() === 'en' ? englishPrompt : arabicPrompt;
  handleAIChatSubmit();
}
window.sendQuickPrompt = sendQuickPrompt;

function appendAIChatReply(container, reply) {
  const tokenPattern = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|\n)/g;
  let lastIndex = 0;
  let match;

  while ((match = tokenPattern.exec(reply)) !== null) {
    container.appendChild(document.createTextNode(reply.slice(lastIndex, match.index)));
    if (match[0] === '\n') {
      container.appendChild(document.createElement('br'));
    } else {
      const isBold = match[0].startsWith('**');
      const emphasis = document.createElement(isBold ? 'strong' : 'em');
      emphasis.textContent = match[0].slice(isBold ? 2 : 1, isBold ? -2 : -1);
      container.appendChild(emphasis);
    }
    lastIndex = tokenPattern.lastIndex;
  }
  container.appendChild(document.createTextNode(reply.slice(lastIndex)));
}

function appendAIChatSources(container, sources, language) {
  if (!Array.isArray(sources) || sources.length === 0) return;

  const sourceList = document.createElement('div');
  sourceList.className = 'ai-chat-sources';
  const label = document.createElement('strong');
  label.textContent = language === 'en' ? 'Sources' : 'المصادر';
  sourceList.appendChild(label);

  sources.forEach((source) => {
    const sourceLabel = document.createElement('span');
    sourceLabel.className = 'ai-chat-source';
    sourceLabel.textContent = language === 'en'
      ? (source.label_en || source.label || '')
      : (source.label || source.label_en || '');
    if (sourceLabel.textContent) sourceList.appendChild(sourceLabel);
  });

  if (sourceList.childElementCount > 1) container.appendChild(sourceList);
}

async function handleAIChatSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const input = document.getElementById('aiChatInput');
  const messagesBox = document.getElementById('aiChatMessages');
  const submitButton = document.getElementById('aiChatSubmit');
  const quickPrompts = document.querySelectorAll('.quick-prompt-btn');
  if (!input || !messagesBox || aiChatSending) return;

  const query = input.value.trim();
  if (!query) return;

  aiChatSending = true;
  const language = getAIChatLanguage();
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  userBubble.setAttribute('dir', language === 'en' ? 'ltr' : 'rtl');
  userBubble.textContent = query;
  messagesBox.appendChild(userBubble);
  input.value = '';

  const botBubble = document.createElement('div');
  botBubble.className = 'chat-bubble bot';
  botBubble.setAttribute('dir', language === 'en' ? 'ltr' : 'rtl');
  const loadingText = document.createElement('span');
  loadingText.textContent = aiChatText(
    'جارٍ البحث في بيانات المنصة...',
    'Searching platform data...'
  );
  botBubble.appendChild(loadingText);
  messagesBox.appendChild(botBubble);
  messagesBox.setAttribute('aria-busy', 'true');
  if (submitButton) submitButton.disabled = true;
  quickPrompts.forEach((button) => { button.disabled = true; });
  messagesBox.scrollTop = messagesBox.scrollHeight;

  const showError = (message) => {
    botBubble.replaceChildren(document.createTextNode(message));
    botBubble.classList.add('error');
  };

  try {
    let response;
    try {
      response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
    } catch {
      showError(aiChatText(
        'تعذر الاتصال بخدمة المساعد. تحقق من اتصالك وحاول مجدداً.',
        'Could not connect to the assistant. Check your connection and try again.'
      ));
      return;
    }

    let data;
    try {
      data = await response.json();
    } catch {
      showError(aiChatText(
        'أعاد المساعد استجابة غير قابلة للقراءة. يرجى المحاولة مرة أخرى.',
        'The assistant returned an unreadable response. Please try again.'
      ));
      return;
    }
    if (!data || typeof data !== 'object') {
      showError(aiChatText(
        'أعاد المساعد استجابة غير صالحة. يرجى المحاولة مرة أخرى.',
        'The assistant returned an invalid response. Please try again.'
      ));
      return;
    }
    const responseLanguage = data.language === 'en' || data.language === 'ar'
      ? data.language
      : language;
    botBubble.replaceChildren();
    botBubble.setAttribute('dir', responseLanguage === 'en' ? 'ltr' : 'rtl');
    if (typeof data.reply === 'string' && data.reply) {
      appendAIChatReply(botBubble, data.reply);
    } else {
      botBubble.textContent = aiChatText(
        'تعذر معالجة الطلب. يرجى المحاولة مرة أخرى.',
        'The request could not be processed. Please try again.'
      );
    }
    appendAIChatSources(botBubble, data.sources, responseLanguage);
    if (!response.ok || data.success === false) botBubble.classList.add('error');
  } finally {
    aiChatSending = false;
    messagesBox.setAttribute('aria-busy', 'false');
    if (submitButton) submitButton.disabled = !input.value.trim();
    quickPrompts.forEach((button) => { button.disabled = false; });
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }
}
window.handleAIChatSubmit = handleAIChatSubmit;

const aiChatForm = document.getElementById('aiChatForm');
aiChatForm?.addEventListener('submit', handleAIChatSubmit);

document.querySelectorAll('.quick-prompt-btn').forEach((button) => {
  button.addEventListener('click', () => {
    sendQuickPrompt(button.dataset.promptAr || '', button.dataset.promptEn || '');
  });
});

document.getElementById('aiChatInput')?.addEventListener('input', (event) => {
  const submitButton = document.getElementById('aiChatSubmit');
  if (submitButton && !aiChatSending) {
    submitButton.disabled = !event.currentTarget.value.trim();
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closePropertyModal();
    const drawer = document.getElementById('aiChatDrawer');
    if (drawer) {
      if (drawer.classList.contains('open')) setAIChatOpen(false);
    }
  }
});
