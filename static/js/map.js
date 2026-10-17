/**
 * map.js - نظام الخريطة التفاعلية
 * Leaflet.js + GeoJSON + Marker Clusters + Heatmap Layers
 */

let map = null;
let markersLayer = null;
let neighborhoodLayer = null;
let parksLayer = null;
let eventsLayer = null;
let currentBaseTile = null;
let propertyList = [];
const mapEnglish = () => document.documentElement.getAttribute('lang') === 'en';
const mapLocalName = (nameAr, nameEn) => mapEnglish() && nameEn ? nameEn : nameAr;
const escapeMapText = value => String(value || '').replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

// ── Tile Layer Definitions ──────────────────────────────────
const TILE_LAYERS = {
  dark: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    className: 'dark-map-tiles',
    maxZoom: 19,
  }),
  satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; Esri, Maxar',
    maxZoom: 19,
  }),
  street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  }),
  terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenTopoMap',
    maxZoom: 17,
  }),
};

let markersById = {};

// ── Pluralization Helpers ────────────────────────────────────
function formatPluralHospitals(count) {
  count = parseInt(count, 10) || 0;
  if (count === 0) return 'لا توجد مستشفيات';
  if (count === 1) return 'مستشفى واحد';
  if (count === 2) return 'مستشفيان';
  if (count >= 3 && count <= 10) return `${count} مستشفيات`;
  return `${count} مستشفى`;
}

function formatPluralSchools(count) {
  count = parseInt(count, 10) || 0;
  if (count === 0) return 'لا توجد مدارس';
  if (count === 1) return 'مدرسة واحدة';
  if (count === 2) return 'مدرستان';
  if (count >= 3 && count <= 10) return `${count} مدارس`;
  return `${count} مدرسة`;
}

function formatPluralParks(count) {
  count = parseInt(count, 10) || 0;
  if (count === 0) return 'لا توجد حدائق';
  if (count === 1) return 'حديقة واحدة';
  if (count === 2) return 'حديقتان';
  if (count >= 3 && count <= 10) return `${count} حدائق`;
  return `${count} حديقة`;
}

// ── Initialize Map ──────────────────────────────────────────
function initMap() {
  map = L.map('map', {
    center: [24.7136, 46.6753],
    zoom: 11,
    zoomControl: false,
  });

  // Add zoom control to top-left (RTL)
  L.control.zoom({ position: 'topleft' }).addTo(map);

  // Default tile layer
  currentBaseTile = TILE_LAYERS.dark;
  currentBaseTile.addTo(map);

  // Ensure map container renders properly without grey tiles
  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 300);
  window.addEventListener('resize', () => {
    if (map) map.invalidateSize();
  });

  // Initialize layers
  markersLayer = L.layerGroup().addTo(map);
  neighborhoodLayer = L.layerGroup().addTo(map);
  parksLayer = L.layerGroup().addTo(map);
  eventsLayer = L.layerGroup().addTo(map);

  // Load initial data
  loadNeighborhoods();
  loadParks();
  loadEvents();
  loadProperties();
}

// ── Tile Layer Switcher ─────────────────────────────────────
function switchTileLayer(layerName) {
  if (currentBaseTile) map.removeLayer(currentBaseTile);
  currentBaseTile = TILE_LAYERS[layerName];
  currentBaseTile.addTo(map);

  document.querySelectorAll('.layer-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.layer === layerName);
  });
}

// ── Score → Color Gradient ──────────────────────────────────
function scoreToColor(score) {
  if (score >= 85) return '#10b981';
  if (score >= 70) return '#f59e0b';
  if (score >= 55) return '#f97316';
  return '#ef4444';
}

// ── Load Neighborhoods GeoJSON ──────────────────────────────
async function loadNeighborhoods() {
  try {
    const res = await fetch('/api/map/neighborhoods');
    const data = await res.json();

    if (!data.success || !data.features) return;

    neighborhoodLayer.clearLayers();

    data.features.forEach(feature => {
      if (!feature.geometry) return;
      const props = feature.properties;
      const score = props.infrastructure_score || 50;
      const color = scoreToColor(score);

      const layer = L.geoJSON(feature, {
        style: {
          fillColor: color,
          fillOpacity: 0.25,
          color: color,
          weight: 2,
          opacity: 0.8,
        },
      });

      layer.bindPopup(`
        <div class="map-popup lang-dir" dir="rtl">
          <h4><span data-ar="${escapeMapText(props.name_ar)}" data-en="${escapeMapText(props.name_en || props.name_ar)}">${escapeMapText(mapLocalName(props.name_ar, props.name_en))}</span></h4>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px">
            <span style="color:#94a3b8;font-size:0.8rem">درجة البنية التحتية</span>
            <strong style="color:${color}">${score}%</strong>
          </div>
          <div style="background:rgba(0,0,0,0.3);border-radius:6px;height:6px;margin-bottom:10px">
            <div style="background:${color};height:100%;width:${score}%;border-radius:6px"></div>
          </div>
          <p style="color:#94a3b8;font-size:0.8rem;margin-bottom:6px">
            <i class="fas fa-home" style="color:#c9a84c;margin-left:4px"></i>
            متوسط الأراضي: ${(props.land_price_per_sqm || 0).toLocaleString('ar-SA')} ريال/م²
          </p>
          <p style="color:#94a3b8;font-size:0.8rem">
            <i class="fas fa-tree" style="color:#10b981;margin-left:4px"></i>
            ${formatPluralParks(props.parks_count)} · <i class="fas fa-hospital" style="color:#3b82f6;margin-left:4px"></i> ${formatPluralHospitals(props.hospitals_count)}
          </p>
          <button onclick="flyToNeighborhood(${props.center_lat},${props.center_lng})"
            style="margin-top:10px;width:100%;padding:6px;background:linear-gradient(135deg,#c9a84c,#e0b860);
            border:none;border-radius:8px;cursor:pointer;color:#0f172a;font-weight:700;font-size:0.8rem;font-family:Tajawal,sans-serif">
            🎯 انتقل إلى الحي
          </button>
        </div>
      `, { maxWidth: 280, className: 'custom-popup' });

      neighborhoodLayer.addLayer(layer);
    });
  } catch (err) {
    console.error('Error loading neighborhoods:', err);
  }
}

// ── Load Parks ──────────────────────────────────────────────
async function loadParks() {
  try {
    const res = await fetch('/api/map/parks');
    const data = await res.json();
    if (!data.success) return;

    parksLayer.clearLayers();

    // Add park markers from API (using center points)
    if (data.features && data.features.length > 0) {
      data.features.forEach(feature => {
        const props = feature.properties;
        if (props.center_lat && props.center_lng) {
          const icon = L.divIcon({
            className: '',
            html: `<div style="width:32px;height:32px;background:rgba(16,185,129,0.9);border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              border:2px solid #10b981;box-shadow:0 0 12px rgba(16,185,129,0.4);font-size:14px">🌳</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          const marker = L.marker([props.center_lat, props.center_lng], { icon });
          marker.bindPopup(`
            <div class="map-popup lang-dir" dir="rtl">
              <h4 style="color:#10b981"><span data-ar="${escapeMapText(props.name_ar)}" data-en="${escapeMapText(props.name_en || props.name_ar)}">${escapeMapText(mapLocalName(props.name_ar, props.name_en))}</span></h4>
              <p style="color:#94a3b8;font-size:0.8rem">النوع: ${props.park_type === 'walkway' ? 'ممشى' : props.park_type === 'garden' ? 'حديقة' : 'متنزه'}</p>
              <p style="color:#94a3b8;font-size:0.8rem">المساحة: ${(props.area_sqm || 0).toLocaleString('ar-SA')} م²</p>
              <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
                ${props.has_gym ? '<span style="background:rgba(16,185,129,0.2);border-radius:20px;padding:2px 8px;font-size:0.7rem;color:#10b981">🏋️ صالة رياضية</span>' : ''}
                ${props.has_playground ? '<span style="background:rgba(59,130,246,0.2);border-radius:20px;padding:2px 8px;font-size:0.7rem;color:#3b82f6">🛝 ملعب أطفال</span>' : ''}
                ${props.has_cafe ? '<span style="background:rgba(201,168,76,0.2);border-radius:20px;padding:2px 8px;font-size:0.7rem;color:#c9a84c">☕ كافيه</span>' : ''}
              </div>
            </div>
          `, { maxWidth: 250, className: 'custom-popup' });
          parksLayer.addLayer(marker);
        }
      });
    }

    // Hardcoded major parks (for demo)
    addMajorParks();
  } catch (err) {
    console.error('Error loading parks:', err);
  }
}

function addMajorParks() {
  const majorParks = [
    { name: 'متنزه السلام', nameEn: 'Al Salam Park', lat: 24.7230, lng: 46.6810, size: 42, emoji: '🌿' },
    { name: 'حديقة الملك سلمان', nameEn: 'King Salman Park', lat: 24.7136, lng: 46.7253, size: 40, emoji: '🌿' },
    { name: 'ممشى الغدير', nameEn: 'Al Ghadir Walkway', lat: 24.7788, lng: 46.7088, size: 28, emoji: '🏃' },
    { name: 'مسار الملك عبد الله', nameEn: 'King Abdullah Path', lat: 24.7600, lng: 46.6900, size: 30, emoji: '🚶' },
    { name: 'الحديقة الشاملة', nameEn: 'Comprehensive Park', lat: 24.8000, lng: 46.6500, size: 24, emoji: '🌸' },
    { name: 'حديقة الملقا', nameEn: 'Al Malqa Park', lat: 24.8288, lng: 46.6388, size: 20, emoji: '🌺' },
  ];

  majorParks.forEach(park => {
    const circle = L.circle([park.lat, park.lng], {
      radius: park.size * 50,
      fillColor: '#10b981',
      fillOpacity: 0.15,
      color: '#10b981',
      weight: 2,
      opacity: 0.6,
    });
    circle.bindTooltip(`${park.emoji} ${mapLocalName(park.name, park.nameEn)}`, {
      permanent: false,
      direction: 'top',
      className: 'park-tooltip',
    });
    parksLayer.addLayer(circle);
  });
}

// ── Load Events Venues ─────────────────────────────────────
function loadEvents() {
  const venues = [
    { name_ar: 'مركز الملك عبدالله المالي', name_en: 'King Abdullah Financial Center', lat: 24.7130, lng: 46.6765, type: 'conference' },
    { name_ar: 'مركز الرياض الدولي للمعارض', name_en: 'Riyadh International Convention & Exhibition Center', lat: 24.7350, lng: 46.7000, type: 'exhibition' },
    { name_ar: 'مدينة الملك سعود للعلوم', name_en: 'King Saud University Science City', lat: 24.7160, lng: 46.6260, type: 'science' },
    { name_ar: 'ميدان الملك فهد', name_en: 'King Fahd Square', lat: 24.6880, lng: 46.7140, type: 'public' },
  ];

  eventsLayer.clearLayers();
  venues.forEach(venue => {
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:32px;height:32px;background:rgba(201,168,76,0.95);border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 0 10px rgba(201,168,76,0.35);font-size:14px">🎉</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([venue.lat, venue.lng], { icon });
    marker.bindPopup(`<div class="map-popup lang-dir" dir="rtl"><h4><span data-ar="${escapeMapText(venue.name_ar)}" data-en="${escapeMapText(venue.name_en)}">${escapeMapText(mapLocalName(venue.name_ar, venue.name_en))}</span></h4><p style="color:#94a3b8;font-size:0.8rem">${venue.name_en}</p><p style="color:#c9a84c;font-size:0.75rem;margin-top:6px">مقر فعاليات ومناسبات</p></div>`, { maxWidth: 220, className: 'custom-popup' });
    eventsLayer.addLayer(marker);
  });
}

// ── Load Metro Lines ────────────────────────────────────────
function loadMetro() {
  const lines = [
    {
      name_ar: 'الخط الأزرق',
      name_en: 'Blue Line',
      color: '#2563eb',
      coords: [
        [24.6900, 46.6500],
        [24.7060, 46.6710],
        [24.7180, 46.6900],
        [24.7320, 46.7150],
        [24.7480, 46.7300],
        [24.7640, 46.7480],
      ],
    },
    {
      name_ar: 'الخط الأخضر',
      name_en: 'Green Line',
      color: '#16a34a',
      coords: [
        [24.7700, 46.6750],
        [24.7540, 46.6940],
        [24.7380, 46.7120],
        [24.7220, 46.7280],
        [24.7060, 46.7420],
      ],
    },
    {
      name_ar: 'الخط الذهبي',
      name_en: 'Gold Line',
      color: '#c9a84c',
      coords: [
        [24.6980, 46.7100],
        [24.7150, 46.6950],
        [24.7320, 46.6800],
        [24.7480, 46.6650],
        [24.7640, 46.6500],
      ],
    },
  ];

  metroLayer.clearLayers();
  lines.forEach(line => {
    const polyline = L.polyline(line.coords, {
      color: line.color,
      weight: 4,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    });
    polyline.bindTooltip(mapLocalName(line.name_ar, line.name_en), { sticky: true, className: 'park-tooltip' });
    metroLayer.addLayer(polyline);
  });
}

// ── Load Properties ─────────────────────────────────────────
async function loadProperties(filters = {}) {
  try {
    const params = new URLSearchParams(filters);
    const res = await fetch(`/api/map/properties?${params}`);
    const data = await res.json();

    if (!data.success) return;

    markersLayer.clearLayers();
    markersById = {};
    propertyList = data.data;

    // Update sidebar list
    updateSidebarList(data.data);

    data.data.forEach(prop => {
      if (!prop.lat || !prop.lng) return;

      const isVilla = prop.property_type === 'villa';
      const isSale = prop.listing_type === 'sale';
      const color = isSale ? '#d4a942' : '#2563eb';
      const emoji = isVilla ? '🏠' : prop.property_type === 'apartment' ? '🏢' : prop.property_type === 'land' ? '🗺️' : '🏪';

      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${color};width:36px;height:36px;border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;
          border:2px solid rgba(255,255,255,0.8);box-shadow:0 3px 10px rgba(0,0,0,0.5);cursor:pointer">
          <span style="transform:rotate(45deg);font-size:15px">${emoji}</span>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([prop.lat, prop.lng], { icon });
      marker.bindPopup(`
        <div class="map-popup" dir="rtl" style="font-family:Tajawal,sans-serif">
          <h4 style="font-size:0.95rem;margin-bottom:6px;color:#f8fafc;font-weight:700">${prop.title}</h4>
          <div class="price" style="font-size:1.15rem;font-weight:800;color:var(--color-accent-primary);margin-bottom:8px">
            ${prop.price_formatted}
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
            <span class="badge ${isSale ? 'badge-sale' : 'badge-rent'}">
              ${isSale ? '🏷️ للبيع' : '🔑 للإيجار السنوي'}
            </span>
            ${prop.bedrooms ? `<span style="background:rgba(255,255,255,0.08);border-radius:20px;padding:2px 8px;font-size:0.75rem;color:#cbd5e1">🛏️ ${prop.bedrooms} غرف</span>` : ''}
            ${prop.area_sqm ? `<span style="background:rgba(255,255,255,0.08);border-radius:20px;padding:2px 8px;font-size:0.75rem;color:#cbd5e1">📐 ${prop.area_sqm} م²</span>` : ''}
          </div>
          ${prop.neighborhood_name ? `<p style="color:#94a3b8;font-size:0.8rem;margin-bottom:8px">📍 ${prop.neighborhood_name}</p>` : ''}
          <button onclick="openPropertyModalById(${prop.id})" class="btn btn-primary btn-sm btn-interactive" style="width:100%;justify-content:center;font-size:0.82rem;font-weight:700">
            <i class="fas fa-info-circle"></i> تفاصيل العقار الكاملة
          </button>
        </div>
      `, { maxWidth: 280, className: 'custom-popup' });

      markersById[prop.id] = marker;
      markersLayer.addLayer(marker);
    });

    // Check if URL has a target property to highlight
    const urlParams = new URLSearchParams(window.location.search);
    const targetPropId = parseInt(urlParams.get('prop_id'), 10);
    if (targetPropId && markersById[targetPropId]) {
      setTimeout(() => {
        flyToPropertyId(targetPropId);
      }, 400);
    }
  } catch (err) {
    console.error('Error loading properties:', err);
  }
}

// ── Sidebar Property List ────────────────────────────────────
function updateSidebarList(properties) {
  const list = document.getElementById('properties-list');
  if (!list) return;

  if (!properties.length) {
    list.innerHTML = `<div class="empty-state" style="padding:2rem"><i class="fas fa-home" style="font-size:2rem;color:#c9a84c;display:block;margin-bottom:0.5rem"></i><p style="color:#94a3b8;font-size:0.9rem">لا توجد عقارات بهذا الفلتر</p></div>`;
    return;
  }

  list.innerHTML = properties.slice(0, 40).map(p => `
    <div class="map-list-item" onclick="flyToPropertyId(${p.id})">
      <h4>${p.title}</h4>
      <div class="price">${p.price_formatted}</div>
      <div class="meta">
        ${p.listing_type === 'sale' ? '🏷️ للبيع' : '🔑 للإيجار السنوي'}
        ${p.bedrooms ? ` · 🛏️ ${p.bedrooms} غرف` : ''}
        ${p.area_sqm ? ` · 📐 ${p.area_sqm} م²` : ''}
      </div>
      <div style="margin-top:0.6rem;display:flex;gap:0.4rem" onclick="event.stopPropagation()">
        <button onclick="openPropertyModalById(${p.id})" class="btn btn-primary btn-sm btn-interactive" style="flex:1;padding:0.3rem 0.5rem;font-size:0.75rem;justify-content:center">
          <i class="fas fa-eye"></i> التفاصيل
        </button>
        <button onclick="flyToPropertyId(${p.id})" class="btn btn-ghost btn-sm btn-interactive" style="flex:1;padding:0.3rem 0.5rem;font-size:0.75rem;justify-content:center">
          <i class="fas fa-map-marker-alt"></i> تحديد
        </button>
      </div>
    </div>
  `).join('');
}

// ── Fly To ──────────────────────────────────────────────────
function flyToNeighborhood(lat, lng) {
  map.flyTo([lat, lng], 14, { duration: 1.2 });
}
window.flyToNeighborhood = flyToNeighborhood;

function flyToProperty(lat, lng) {
  map.flyTo([lat, lng], 16, { duration: 0.8 });
}
window.flyToProperty = flyToProperty;

function flyToPropertyId(propId) {
  const marker = markersById[propId];
  const prop = propertyList.find(p => p.id === propId);
  if (marker && prop) {
    map.flyTo([prop.lat, prop.lng], 16, { duration: 1.0 });
    setTimeout(() => {
      marker.openPopup();
    }, 1050);
  } else if (prop) {
    map.flyTo([prop.lat, prop.lng], 16, { duration: 1.0 });
  }
}
window.flyToPropertyId = flyToPropertyId;

// ── Toggle Layers ────────────────────────────────────────────
function toggleLayer(layerName) {
  const layers = {
    neighborhoods: neighborhoodLayer,
    parks: parksLayer,
    events: eventsLayer,
    properties: markersLayer,
  };

  const layer = layers[layerName];
  if (!layer) return;

  const btn = document.querySelector(`[data-overlay="${layerName}"]`);
  if (map.hasLayer(layer)) {
    map.removeLayer(layer);
    btn?.classList.remove('active');
  } else {
    map.addLayer(layer);
    btn?.classList.add('active');
  }
}
window.toggleLayer = toggleLayer;

// ── Apply Filters ────────────────────────────────────────────
function applyFilters() {
  const filters = {};
  const propType = document.getElementById('filter-type')?.value;
  const listingType = document.getElementById('filter-listing')?.value;

  if (propType) filters.property_type = propType;
  if (listingType) filters.listing_type = listingType;

  loadProperties(filters);
}
window.applyFilters = applyFilters;

// ── Init ─────────────────────────────────────────────────────
if (document.getElementById('map')) {
  initMap();

  // Tile layer buttons
  document.querySelectorAll('.layer-btn[data-layer]').forEach(btn => {
    btn.addEventListener('click', () => switchTileLayer(btn.dataset.layer));
  });

  // Filter change
  document.getElementById('filter-type')?.addEventListener('change', applyFilters);
  document.getElementById('filter-listing')?.addEventListener('change', applyFilters);
}
