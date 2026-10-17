/**
 * interactions.js - محرك التأثيرات البصرية
 * Scroll Reveal, Ripple, Skeleton, Card Tilt, Number Counter, Tooltips
 * Phase 1 — Enhanced micro-interactions
 */

// ── Scroll Reveal ──────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));
// Expose for dynamic elements
window.revealObserver = revealObserver;


// ── Ripple Effect ───────────────────────────────────────────
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-interactive');
  if (!btn) return;

  const ripple = document.createElement('span');
  ripple.classList.add('ripple');

  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  btn.appendChild(ripple);

  setTimeout(() => ripple.remove(), 700);
});


// ── Number Counter Animation ────────────────────────────────
function animateCounter(el) {
  const target = parseInt(el.dataset.count, 10);
  if (isNaN(target)) return;
  const duration = 2200;
  const step = target / (duration / 16);
  let current = 0;

  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      el.textContent = target.toLocaleString('ar-SA');
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(current).toLocaleString('ar-SA');
    }
  }, 16);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.counted) {
      entry.target.dataset.counted = 'true';
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));


// ── Skeleton Loaders ────────────────────────────────────────
function showSkeletons(container, count = 3) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const sk = document.createElement('div');
    sk.className = 'skeleton skeleton-card';
    container.appendChild(sk);
  }
}
window.showSkeletons = showSkeletons;

function hideSkeletons(container) {
  container.querySelectorAll('.skeleton').forEach(s => s.remove());
}
window.hideSkeletons = hideSkeletons;


// ── Card Tilt Effect — uses event delegation for dynamic cards ──
function initCardTilt(container) {
  const target = container || document;
  
  target.addEventListener('mousemove', (e) => {
    const card = e.target.closest('.card-lift');
    if (!card) return;
    
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const maxTilt = 4;
    const tiltX = (y / (rect.height / 2)) * maxTilt;
    const tiltY = -(x / (rect.width / 2)) * maxTilt;
    card.style.transform = `translateY(-8px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  });
  
  target.addEventListener('mouseleave', (e) => {
    const card = e.target.closest('.card-lift');
    if (card) card.style.transform = '';
  }, true);
}

// Initialize card tilt globally via delegation
initCardTilt(document.body);


// ── Navbar Scroll ───────────────────────────────────────────
const navbar = document.querySelector('.navbar');
if (navbar) {
  let lastScrollY = 0;
  let ticking = false;
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}


// ── Mobile Menu ─────────────────────────────────────────────
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.navbar-nav');
if (menuToggle && navLinks) {
  const closeMenu = () => {
    menuToggle.classList.remove('open');
    navLinks.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  };

  menuToggle.addEventListener('click', () => {
    const isOpen = !navLinks.classList.contains('open');
    menuToggle.classList.toggle('open', isOpen);
    navLinks.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
  
  // Close menu when clicking a link
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar-nav') && !e.target.closest('.menu-toggle')) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

// ── Mobile Map Sidebar Toggle ───────────────────────────────
const mapSidebarToggle = document.getElementById('map-sidebar-toggle');
const mapSidebar = document.querySelector('.map-sidebar');
if (mapSidebarToggle && mapSidebar) {
  mapSidebarToggle.addEventListener('click', () => {
    mapSidebar.classList.toggle('open');
    mapSidebarToggle.classList.toggle('active');
    // Toggle icon
    const icon = mapSidebarToggle.querySelector('i');
    if (icon) {
      icon.className = mapSidebar.classList.contains('open') ? 'fas fa-times' : 'fas fa-sliders-h';
    }
  });
}


// ── Loading Overlay ─────────────────────────────────────────
window.addEventListener('load', () => {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
    setTimeout(() => overlay.remove(), 600);
  }
});


// ── Progress Bars Animation ─────────────────────────────────
const progressObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const fill = entry.target.querySelector('.progress-fill');
      if (fill) {
        const width = fill.dataset.width;
        setTimeout(() => { fill.style.width = width + '%'; }, 150);
      }
      progressObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.progress-bar').forEach(bar => progressObserver.observe(bar));


// ── Floating Label ──────────────────────────────────────────
document.querySelectorAll('.floating-label-group input, .floating-label-group select').forEach(input => {
  const checkFill = () => {
    input.closest('.floating-label-group').classList.toggle('filled', !!input.value);
  };
  input.addEventListener('input', checkFill);
  input.addEventListener('change', checkFill);
  checkFill();
});


// ── Toast Notifications ─────────────────────────────────────
window.showToast = function(message, type = 'success') {
  const toast = document.createElement('div');
  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle';
  toast.className = `flash flash-${type}`;
  toast.style.cssText = 'position:fixed;top:80px;left:1.5rem;z-index:9999;min-width:280px;max-width:420px;animation:slideIn 0.35s ease-out;';
  toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

// ── Active Nav Link ─────────────────────────────────────────
const currentPath = window.location.pathname;
document.querySelectorAll('.nav-link').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
    link.classList.add('active');
  }
});

// ── Market Bar Animation ────────────────────────────────────
const marketBarObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.market-bar-fill').forEach(fill => {
        const target = fill.dataset.width;
        if (target) {
          setTimeout(() => { fill.style.width = target + '%'; }, 250);
        }
      });
      marketBarObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });
document.querySelectorAll('.developer-card').forEach(card => marketBarObs.observe(card));

// ── Theme Toggle ──────────────────────────────────────────────
const themeToggleBtn = document.getElementById('themeToggle');
if (themeToggleBtn) {
  const themeIcon = themeToggleBtn.querySelector('i');
  const themeLabel = themeToggleBtn.querySelector('.toggle-label');

  const applyTheme = (theme) => {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      if (themeIcon) themeIcon.className = 'fas fa-moon';
      if (themeLabel) themeLabel.textContent = themeLabel.dataset.en || 'Day';
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (themeIcon) themeIcon.className = 'fas fa-sun';
      if (themeLabel) themeLabel.textContent = themeLabel.dataset.ar || 'ليلي';
    }
    localStorage.setItem('theme', theme);
    document.dispatchEvent(new CustomEvent('aqar-theme-change', { detail: { theme } }));
  };

  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
  });
}

// ── Language Toggle (RTL / LTR) ──────────────────────────────
const langToggleBtn = document.getElementById('langToggle');
if (langToggleBtn) {
  const langLabel = document.getElementById('langLabel');

  const translationMap = {
    'الرئيسية': 'Home',
    'الخريطة': 'Map',
    'العقارات المميزة': 'Featured Properties',
    'العقارات المتاحة': 'Available Properties',
    'العقارات': 'Properties',
    'المقارنة': 'Compare',
    'أبرز الأحياء': 'Top Neighborhoods',
    'الإحصائيات': 'Statistics',
    'المطورون': 'Developers',
    'ليلي': 'Day',
    'الوحدة': 'Unit',
    'فتح خيارات الخريطة': 'Open map options',
    'العودة للرئيسية': 'Return to homepage',
    'تسجيل الخروج': 'Logout',
    'تغيير المظهر': 'Toggle theme',
    'تغيير اللغة': 'Toggle language',
    'جاري التحميل...': 'Loading...',
    'المطورون العقاريون': 'Real Estate Developers',
    'لوحة الإدارة': 'Admin Dashboard',
    'الصفحات': 'Pages',
    'المصادر': 'Resources',
    'بيانات': 'Data',
    'عرض الكل': 'View all',
    'المطورون المعتمدون من برنامج وافي مع بياناتهم وتقييماتهم': 'Certified WAFI developers with their data and ratings',
    'اختر حيين أو أكثر لمقارنة مستوى الخدمات والأسعار وجودة البنية التحتية': 'Choose two or more neighborhoods to compare services, prices, and infrastructure quality',
    'عرض المقارنة': 'Show comparison',
    'مقارنة سريعة (أفضل 3 أحياء)': 'Quick compare (top 3 neighborhoods)',
    'ابدأ المقارنة': 'Start the comparison',
    'اختر حيين أو أكثر من القائمة أعلاه ثم اضغط "عرض المقارنة"': 'Select two or more neighborhoods above and click "Show comparison"',
    'المركز': 'Center',
    'نوع العقار': 'Property type',
    'نوع العرض': 'Listing type',
    'الحي': 'Neighborhood',
    'بحث': 'Search',
    'تصفية': 'Filter',
    'إعادة': 'Reset',
    'عقار مسجل': 'Properties listed',
    'حي تم تحليله': 'Neighborhoods analyzed',
    'مطور موثق': 'Verified developers',
    '% بيانات حقيقية': '% verified data',
    'الخدمة': 'Service',
    'المزيد': 'More',
    'الأفضل': 'Best',
    'تحديث دوري': 'Regular update',
    'البيانات لأغراض أكاديمية فقط. تحقق دائماً من الموقع الرسمي لبرنامج وافي قبل التعاقد مع أي مطور.': 'For academic purposes only. Always verify with the official WAFI program before contracting any developer.',
    'الطبقات': 'Layers',
    'خيارات الخريطة': 'Map Options',
    'طبقة الخريطة': 'Map layer',
    '🌙 داكن': '🌙 Dark',
    '🛰️ أقمار': '🛰️ Satellite',
    '🗺️ شوارع': '🗺️ Streets',
    '⛰️ تضاريس': '⛰️ Terrain',
    'تصفية العقارات': 'Property filtering',
    'فيلا': 'Villa',
    'شقة': 'Apartment',
    'أرض': 'Land',
    'تجاري': 'Commercial',
    'للبيع': 'For sale',
    'للإيجار': 'For rent',
    'مقياس البنية التحتية': 'Infrastructure scale',
    'ممتاز': 'Excellent',
    'جيد جداً': 'Very good',
    'جيد': 'Good',
    'يحتاج تحسين': 'Needs improvement',
    'أقل من 55': 'Below 55',
    'انتقل إلى الحي': 'Go to neighborhood',
    'الأحياء - انتقل سريعاً': 'Neighborhoods - Quick access',
    'العقارات الظاهرة على الخريطة': 'Properties shown on the map',
    'أبرز الأحياء': 'Top neighborhoods',
    'تحليل شامل لأفضل الأحياء السكنية في الرياض بناءً على البنية التحتية والخدمات': "A comprehensive analysis of Riyadh's best residential neighborhoods based on infrastructure and services",
    'قارن بين الأحياء': 'Compare neighborhoods',
    'لماذا عقار ذكي؟': 'Why Aqar Dhaki?',
    'تقنيات متقدمة لمساعدتك في اتخاذ أفضل قرار عقاري': 'Advanced technologies to help you make the best real estate decision',
    'ابدأ رحلتك العقارية الآن': 'Start your real estate journey now',
    'حجم العرض والطلب': 'Supply and demand volume',
    'متوسط سعر المتر (أراضي)': 'Average price per sqm (lands)',
    'توزيع العقارات': 'Property distribution',
    'الإيجار مقابل البيع': 'Rent vs Sale',
    'أعلى الأحياء عائداً (ROI)': 'Top ROI neighborhoods',
    'نمو حجم المعروض (5 سنوات)': 'Supply growth (5 years)',
    'متوسط نمو أسعار الأراضي سنوياً': 'Average yearly land price growth',
    'عقار متاح للبيع هذا الشهر': 'Properties available for sale this month',
    'أعلى عائد إيجاري (حي الملقا)': 'Highest rental yield (Al Malqa)',
    'إجمالي المشاريع': 'Total projects',
    'مُسلَّم': 'Delivered',
    'نشط': 'Active',
    'الحصة السوقية': 'Market share',
    'منذ': 'Since',
    'موثق وافي': 'WAFI certified',
    'تحديث دوري': 'Regular update',
    'السنة': 'Year',
    'مدة': 'Duration',
    'اكتشف عقارك المثالي': 'Find your ideal property',
    'بقوة': 'Powered by',
    'الذكاء الاصطناعي': 'Artificial Intelligence',
    'المنصة العقارية الأذكى في الرياض': "Riyadh's smartest real estate platform",
    'منصة متقدمة تجمع بيانات إيجار ووافي مع الخرائط التفاعلية لمساعدتك في اتخاذ أفضل قرار استثماري في سوق عقارات الرياض.': 'An advanced platform combining Ejar and WAFI data with interactive maps to help you make better investment decisions in Riyadh real estate.',
    'استكشف الخريطة': 'Explore the map',
    'استكشف الخريطة التفاعلية': 'Explore the interactive map',
    'افتح الخريطة': 'Open map',
    'قارن الأحياء': 'Compare neighborhoods',
    'عقار مسجل': 'Properties listed',
    'حي تم تحليله': 'Neighborhoods analyzed',
    'مطور موثق': 'Verified developers',
    '% بيانات حقيقية': '% verified data',
    'نوع العقار': 'Property type',
    'نوع العرض': 'Listing type',
    'الكل': 'All',
    'كل الأحياء': 'All neighborhoods',
    'بحث': 'Search',
    'العقارات المميزة': 'Featured properties',
    'أفضل العقارات المتاحة حالياً في أرقى أحياء الرياض': "The best properties currently available in Riyadh's finest neighborhoods",
    'عرض الكل': 'View all',
    'عرض التفاصيل': 'View details',
    'التفاصيل': 'Details',
    'بالخريطة': 'View on map',
    'الأحياء': 'Neighborhoods',
    'تحليل شامل لأفضل الأحياء السكنية في الرياض بناءً على البنية التحتية والخدمات': "A comprehensive analysis of Riyadh's top residential neighborhoods based on infrastructure and services",
    'ريال': 'SAR',
    'ريال/م²': 'SAR/sqm',
    'غرف': 'Bedrooms',
    'حمام': 'Bathrooms',
    'الحدائق': 'Parks',
    'المستشفيات': 'Hospitals',
    'المدارس': 'Schools',
    'المجمعات': 'Malls',
    'المقاهي': 'Cafes',
    'مساحة مبنية': 'Built-up area',
    'مداخل طرق': 'Road access',
    'سعر الأرض': 'Land price',
    'متوسط الإيجار': 'Average rent',
    'البنية التحتية': 'Infrastructure',
    'المساحة الإجمالية': 'Total area',
    'سعر المتر المربع': 'Price per square meter',
    'غرف النوم': 'Bedrooms',
    'دورات المياه': 'Bathrooms',
    'تفاصيل ومميزات العقار': 'Property details and features',
    'تحديد على الخريطة التفاعلية': 'Show on interactive map',
    'مشاركة': 'Share',
    'تواصل / استفسار': 'Contact / Enquire',
    'عقار مميز بموقع استراتيجي بالقرب من الخدمات والمرافق الرئيسية في الرياض.': 'A featured property in a strategic location near key services and facilities in Riyadh.',
    'قيمة الإيجار السنوي': 'Annual rent',
    'سعر الشراء الإجمالي': 'Total purchase price',
    'غير متوفر': 'Not available',
    'تحديث يومي:': 'Daily update:',
    'يتم تحديث البيانات العقارية بشكل دوري.': 'Property data is updated regularly.',
    'هذا المشروع': 'This project',
    'أكاديمي/تجريبي فقط': 'for academic and experimental purposes only',
    'ليس للاستخدام التجاري.': 'Not for commercial use.',
    'منصة عقارية أكاديمية متقدمة لتحليل سوق العقارات في مدينة الرياض باستخدام الذكاء الاصطناعي والخرائط التفاعلية.': 'An advanced academic platform for analyzing Riyadh real estate using AI and interactive maps.',
    'الصفحات': 'Pages',
    'الخريطة التفاعلية': 'Interactive map',
    'المصادر': 'Resources',
    'شبكة إيجار': 'Ejar Network',
    'برنامج وافي': 'WAFI Program',
    'الإدارة': 'Admin',
    'تواصل معنا': 'Contact us',
    'الرياض، المملكة العربية السعودية': 'Riyadh, Saudi Arabia',
    'البيانات لأغراض أكاديمية فقط. تحقق دائماً من الموقع الرسمي لبرنامج': 'For academic purposes only. Always verify with the official website of the',
    'قبل التعاقد مع أي مطور.': 'before signing a contract with any developer.',
    'مطورون معتمدون من برنامج': 'Developers certified by the',
    'مع بياناتهم وتقييماتهم': 'with their profiles and ratings',
    'مطور موثق': 'verified developers',
    'حصة كل مطور في السوق': 'Each developer’s market share',
    'ملخص السوق': 'Market overview',
    'موثق وافي': 'WAFI certified',
    'إجمالي المشاريع': 'Total projects',
    'مُسلَّم': 'Delivered',
    'نشط': 'Active',
    'الحصة السوقية': 'Market share',
    'منذ': 'Since',
    'خطأ في الخادم': 'Server error',
    'الصفحة غير موجودة': 'Page not found',
    'يبدو أن الصفحة التي تبحث عنها غير موجودة أو تم نقلها.': 'The page you are looking for may have been moved or no longer exists.',
    'يمكنك العودة للرئيسية أو استكشاف الخريطة.': 'You can return home or explore the map.',
    'حدث خطأ غير متوقع. فريقنا على علم بالمشكلة ويعمل على حلها.': 'An unexpected error occurred. Our team is aware and is working on a fix.',
    'يرجى المحاولة مرة أخرى لاحقاً.': 'Please try again later.',
    'إعادة المحاولة': 'Try again',
    'مستشار عقار ذكي': 'Smart real estate advisor',
    'مرحباً بك! أنا مستشارك العقاري الذكي في الرياض. يمكنك سؤالي عن:': 'Welcome! I am your smart real estate advisor for Riyadh. Ask me about:',
    'أفضل الأحياء السكنية والاستثمارية': 'The best residential and investment neighborhoods',
    'مقارنة الخدمات والأسعار بين الأحياء': 'Comparing neighborhood services and prices',
    'البحث عن فلل أو شقق تناسب ميزانيتك': 'Finding villas or apartments within your budget',
    'قارن حطين والملقا': 'Compare Hittin and Al Malqa',
    'أفضل الأحياء للعائلات': 'Best neighborhoods for families',
    'أرخص الفلل': 'Most affordable villas',
    'اكتب استفسارك هنا...': 'Type your question here...',
    'وافي': 'WAFI',
    'إيجار': 'Ejar',
    'الرياض': 'Riyadh',
    'عقار ذكي': 'Smart Real Estate',
    'النوع:': 'Type:',
    'المساحة:': 'Area:',
    'صالة رياضية': 'Gym',
    'ملعب أطفال': 'Playground',
    'كافيه': 'Cafe',
    'ممشى': 'Walkway',
    'حديقة': 'Garden',
    'متنزه': 'Park',
    'مقر فعاليات ومناسبات': 'Event and function venue',
    'الخط الأزرق': 'Blue Line',
    'الخط الأخضر': 'Green Line',
    'الخط الذهبي': 'Gold Line',
    'متنزه السلام': 'Al Salam Park',
    'حديقة الملك سلمان': 'King Salman Park',
    'ممشى الغدير': 'Al Ghadir Walkway',
    'مسار الملك عبد الله': 'King Abdullah Path',
    'الحديقة الشاملة': 'Comprehensive Park',
    'حديقة الملقا': 'Al Malqa Park',
    'نموذج RAG مدرب على بيانات السوق المحلية لمساعدتك في القرارات الاستثمارية': 'A RAG model trained on local market data to help with investment decisions',
    'خرائط بطبقات متعددة تعرض الأحياء بتلوين حراري بناءً على جودة البنية التحتية': 'Multi-layer maps with neighborhood heatmaps based on infrastructure quality',
    'رسوم بيانية تُظهر تطور أسعار المتر المربع في كل حي على مدى 5 سنوات': 'Charts showing five-year price-per-square-meter trends in each neighborhood',
    'بيانات مطورين معتمدين من برنامج وافي مع تقييمات وحصص السوق': 'Profiles, ratings, and market shares for WAFI-certified developers',
    'منصة متقدمة تجمع بيانات إيجار ووافي': 'An advanced platform combining Ejar and WAFI data',
    'اكتشف سوق العقارات في الرياض بذكاء.': 'Explore Riyadh real estate with insight.',
    'خرائط تفاعلية، تحليل الأحياء، وبيانات إيجار ووافي في منصة واحدة.': 'Interactive maps, neighborhood analysis, and Ejar and WAFI data in one platform.',
    'تحليل تفصيلي لبيانات السوق العقاري في الرياض واتجاهات العرض والطلب.': 'An in-depth analysis of Riyadh real estate data and supply and demand trends.',
    'العروض العقارية': 'Property listings',
    'الطلب المستدام': 'Ongoing demand',
    'متوسط السعر (ريال/م²)': 'Average price (SAR/sqm)',
    'بالريال السعودي': 'In Saudi riyals',
    'آخر 5 سنوات': 'Last 5 years',
    'توزيع العقارات': 'Property distribution',
    'الإيجار مقابل البيع': 'Rent vs. sale',
    'أعلى الأحياء عائداً (ROI)': 'Top neighborhoods by ROI',
    'يتم تحديث البيانات بانتظام لضمان دقة المؤشرات العقارية المعروضة.': 'Data is updated regularly to keep the displayed real estate indicators accurate.',
    'مقارنة الأحياء': 'Neighborhood Comparison',
    'اختر الأحياء للمقارنة (2 إلى 4 أحياء)': 'Choose neighborhoods to compare (2 to 4)',
    'الحي الأول': 'First neighborhood',
    'الحي الثاني': 'Second neighborhood',
    'الحي الثالث': 'Third neighborhood',
    'الحي الرابع': 'Fourth neighborhood',
    '-- اختر حياً --': '-- Select a neighborhood --',
    'عرض المقارنة': 'Show comparison',
    'مقارنة سريعة (أفضل 3 أحياء)': 'Quick compare (top 3 neighborhoods)',
    'ابدأ المقارنة': 'Start comparing',
    'اختر حيين أو أكثر من القائمة أعلاه ثم اضغط "عرض المقارنة"': 'Select at least two neighborhoods above, then click "Show comparison".',
    'اختر حيين أو أكثر للمقارنة': 'Select at least two neighborhoods to compare',
    'يرجى اختيار حيين على الأقل للمقارنة': 'Please select at least two neighborhoods to compare',
    'تطور سعر المتر المربع (ريال)': 'Price per square meter trend (SAR)',
    'مقارنة الخدمات والمرافق': 'Services and facilities comparison',
    'العقارات المتاحة': 'Available properties',
    'عقار متاح': 'properties available',
    'كل الأحياء': 'All neighborhoods',
    'تصفية': 'Filter',
    'إعادة': 'Reset',
    'لا توجد عقارات بهذه المعايير': 'No properties match these filters',
    'جرب تغيير معايير البحث أو': 'Try changing your search filters or',
    'عرض كل العقارات': 'view all properties',
    'لا توجد عقارات حالياً': 'No properties available right now',
    'سيتم إضافة عقارات قريباً': 'More properties will be added soon',
    'لا توجد عقارات بهذا الفلتر': 'No properties match this filter',
    'حدث خطأ في جلب البيانات': 'There was an error fetching the data',
    'جاري تحميل العقارات...': 'Loading properties...',
    'يتم تحديث البيانات بانتظام لضمان دقة المؤشرات العقارية المعروضة.': 'Data is updated regularly to keep the displayed real estate indicators accurate.',
    'تحتاج': 'Needs',
    'مرافق': 'Facilities',
    'نظرة عامة على سوق العقارات في الرياض': 'Riyadh real estate market overview',
    'العقارات الذكية': 'Smart real estate',
    'استكشف الخريطة التفاعلية وقارن بين الأحياء لاتخاذ أفضل قرار استثماري': 'Explore the interactive map and compare neighborhoods to make better investment decisions',
    'تصفح المطورين': 'Browse developers',
    'ابحث عن مستشارك العقاري': 'Find your real estate advisor',
    'ويمكنك سؤالي عن': 'You can ask me about',
    'المخططات': 'Plans',
    'عقار مميز': 'Featured property',
    'للإيجار السنوي': 'For annual rent',
    'درجة البنية التحتية': 'Infrastructure score',
    'متوسط الأراضي': 'Average land price',
    'نوع العقار': 'Property type',
    'نوع العرض': 'Listing type',
    'اختر حياً': 'Select a neighborhood',
    'لا توجد مدارس': 'No schools',
    'لا توجد مستشفيات': 'No hospitals',
    'لا توجد حدائق': 'No parks',
    'مدرسة واحدة': '1 school',
    'مدرستان': '2 schools',
    'مستشفى واحد': '1 hospital',
    'مستشفيان': '2 hospitals',
    'حديقة واحدة': '1 park',
    'حديقتان': '2 parks',
    'المنصة العقارية الأذكى في الرياض': "Riyadh's smartest real estate platform",
    'استكشف الخريطة التفاعلية': 'Explore the interactive map',
    'اكتشف سوق العقارات في الرياض بذكاء.': 'Explore the Riyadh real estate market with insight.',
    'منصة متقدمة تجمع بيانات إيجار ووافي مع الخرائط التفاعلية لمساعدتك في اتخاذ أفضل قرار استثماري في سوق عقارات الرياض.': 'An advanced platform combining Ejar and WAFI data with interactive maps to help you make better investment decisions in Riyadh real estate.',
    'أفضل العقارات المتاحة حالياً في أرقى أحياء الرياض': "The best properties currently available in Riyadh's finest neighborhoods",
    'استكشف الخريطة التفاعلية وقارن بين الأحياء لاتخاذ أفضل قرار استثماري': 'Explore the interactive map and compare neighborhoods to make better investment decisions',
    'تحليل شامل لأفضل الأحياء السكنية في الرياض بناءً على البنية التحتية والخدمات': "A comprehensive analysis of Riyadh's best residential neighborhoods based on infrastructure and services",
    'خرائط بطبقات متعددة تعرض الأحياء بتلوين حراري بناءً على جودة البنية التحتية': 'Multi-layer maps show neighborhoods with heatmaps based on infrastructure quality',
    'رسوم بيانية تُظهر تطور أسعار المتر المربع في كل حي على مدى 5 سنوات': 'Charts show five-year price-per-square-meter trends in each neighborhood',
    'نموذج RAG مدرب على بيانات السوق المحلية لمساعدتك في القرارات الاستثمارية': 'A RAG model trained on local market data to help with investment decisions',
    'قارن بين حي حطين وحي الملقا': 'Compare Hittin and Al Malqa',
    'ما أفضل الأحياء للعائلات؟': 'Which neighborhoods are best for families?',
    'أرخص الفلل المتاحة للبيع': 'Most affordable villas for sale',
    'تحليل تفصيلي لبيانات السوق العقاري في الرياض واتجاهات العرض والطلب.': 'An in-depth analysis of Riyadh real estate data and supply and demand trends.',
    'نمو حجم المعروض (5 سنوات)': 'Supply growth (5 years)',
    'متوسط نمو أسعار الأراضي سنوياً': 'Average annual land price growth',
    'عقار متاح للبيع هذا الشهر': 'Properties available for sale this month',
    'أعلى عائد إيجاري (حي الملقا)': 'Highest rental yield (Al Malqa)',
    'تطور سعر المتر المربع (ريال)': 'Price per square meter trend (SAR)',
    'مقارنة الخدمات والمرافق': 'Services and facilities comparison',
    'اختر الأحياء للمقارنة (2 إلى 4 أحياء)': 'Choose neighborhoods to compare (2 to 4)',
    'الحي الأول': 'First neighborhood',
    'الحي الثاني': 'Second neighborhood',
    'الحي الثالث': 'Third neighborhood',
    'الحي الرابع': 'Fourth neighborhood',
    '-- اختر حياً --': '-- Select a neighborhood --',
    'اختر حيين أو أكثر من القائمة أعلاه ثم اضغط "عرض المقارنة"': 'Select two or more neighborhoods above, then click "Show comparison".',
    'مطورون معتمدون من برنامج': 'Developers certified by the',
    'مع بياناتهم وتقييماتهم': 'with their profiles and ratings',
    'البيانات لأغراض أكاديمية فقط. تحقق دائماً من الموقع الرسمي لبرنامج': 'For academic purposes only. Always verify with the official website of the',
    'قبل التعاقد مع أي مطور.': 'before signing a contract with any developer.',
    'حصة كل مطور في السوق': 'Each developer’s market share',
    'مقياس البنية التحتية': 'Infrastructure scale',
    'العقارات الظاهرة على الخريطة': 'Properties shown on the map',
    'التفاصيل ومميزات العقار': 'Property details and features',
    'جاري تحميل العقارات...': 'Loading properties...',
    'لا توجد عقارات بهذا الفلتر': 'No properties match this filter',
    'لا توجد عقارات بهذه المعايير': 'No properties match these filters',
    'جرب تغيير معايير البحث أو': 'Try changing your search criteria or',
    'سيتم إضافة عقارات قريباً': 'More properties will be added soon',
    'يتم تحديث البيانات بانتظام لضمان دقة المؤشرات العقارية المعروضة.': 'Data is updated regularly to keep the displayed real estate indicators accurate.',
    'مستشار عقار ذكي التفاعلي': 'Interactive smart real estate advisor',
    'الصفحة التي تبحث عنها غير موجودة': 'The page you are looking for was not found',
    'يبدو أن الصفحة التي تبحث عنها غير موجودة أو تم نقلها.': 'The page you are looking for may have been moved or no longer exists.',
    'يمكنك العودة للرئيسية أو استكشاف الخريطة.': 'You can return home or explore the map.',
    'حدث خطأ غير متوقع. فريقنا على علم بالمشكلة ويعمل على حلها.': 'An unexpected error occurred. Our team is aware of the problem and is working on a fix.',
    'يرجى المحاولة مرة أخرى لاحقاً.': 'Please try again later.',
    'إعادة المحاولة': 'Try again',
    'منصة عقارية أكاديمية متقدمة لتحليل سوق العقارات في مدينة الرياض باستخدام الذكاء الاصطناعي والخرائط التفاعلية.': 'An advanced academic platform for analyzing Riyadh real estate using AI and interactive maps.',
    'يتم تحديث البيانات العقارية بشكل دوري.': 'Property data is updated regularly.',
    'هذا المشروع': 'This project',
    'أكاديمي/تجريبي فقط': 'for academic and experimental purposes only',
    'ليس للاستخدام التجاري.': 'Not for commercial use.',
    'شبكة إيجار': 'Ejar Network',
    'الرياض، المملكة العربية السعودية': 'Riyadh, Saudi Arabia',
    'مستشار عقار ذكي': 'Smart real estate advisor',
    'مرحباً بك! أنا مستشارك العقاري الذكي في الرياض. يمكنك سؤالي عن:': 'Welcome! I am your smart real estate advisor for Riyadh. You can ask me about:',
    'أفضل الأحياء السكنية والاستثمارية': 'The best residential and investment neighborhoods',
    'مقارنة الخدمات والأسعار بين الأحياء': 'Comparing services and prices between neighborhoods',
    'البحث عن فلل أو شقق تناسب ميزانيتك': 'Finding villas or apartments within your budget',
    'قارن حطين والملقا': 'Compare Hittin and Al Malqa',
    'أفضل الأحياء للعائلات': 'Best neighborhoods for families',
    'أرخص الفلل': 'Most affordable villas',
    'اكتب استفسارك هنا...': 'Type your question here...',
    'الإحصائيات والمؤشرات العقارية': 'Real Estate Statistics and Indicators',
    'خطأ في الخادم': 'Server Error',
    'الصفحة غير موجودة': 'Page Not Found',
    'مطورون معتمدون من برنامج وافي مع بياناتهم وتقييماتهم': 'WAFI-certified developers with their profiles and ratings',
    'البيانات لأغراض أكاديمية فقط. تحقق دائماً من الموقع الرسمي لبرنامج وافي قبل التعاقد مع أي مطور.': 'For academic purposes only. Always verify with the official WAFI website before contracting any developer.',
    'اختر حيين أو أكثر لمقارنة مستوى الخدمات والأسعار وجودة البنية التحتية': 'Choose two or more neighborhoods to compare services, prices, and infrastructure quality.',
    'هذه الصفحة مخصصة للمشرفين فقط': 'This page is for administrators only',
    'منصة العقار الذكية - الرياض': 'Smart Real Estate Platform - Riyadh',
    'كلمة المرور': 'Password',
    'اسم المستخدم': 'Username',
    'تسجيل الدخول': 'Log in',
    'مرحباً، المشرف': 'Welcome, Admin',
    'حفظ التغييرات': 'Save changes',
    'إضافة عقار': 'Add property',
    'إضافة مطور': 'Add developer',
    'إضافة حي': 'Add neighborhood',
    'لا توجد بيانات': 'No data available',
    'أفضل العقارات': 'Top properties',
    'المساحة': 'Area',
    'السعر': 'Price',
    'الإيجار السنوي': 'Annual rent',
    'للإيجار السنوي': 'For annual rent',
    'م²': 'sqm',
    'سنوياً': 'annually',
    'حدائق': 'parks',
    'مستشفيات': 'hospitals',
    'مدارس': 'schools',
    'مستشفى': 'hospital',
    'مدرسة': 'school',
    'حديقة': 'park',
  };
  const sortedTranslations = Object.entries(translationMap).sort(([a], [b]) => b.length - a.length);
  const originalPageTitle = document.title;
  const descriptionMeta = document.querySelector('meta[name="description"]');
  const originalMetaDescription = descriptionMeta?.getAttribute('content') || '';

  const translateString = (text, isEnglish) => {
    if (!isEnglish) return text;
    let translated = text;
    sortedTranslations.forEach(([arabic, english]) => {
      if (translated.includes(arabic)) translated = translated.split(arabic).join(english);
    });
    return translated;
  };
  window.translateForCurrentLanguage = text => translateString(
    String(text),
    document.documentElement.getAttribute('lang') === 'en'
  );

  const translateTextNode = (node, isEnglish) => {
    if (!node || !node.nodeValue || !node.nodeValue.trim()) return;
    if (node._originalArabic === undefined) {
      node._originalArabic = node.nodeValue;
    }

    const translated = translateString(node._originalArabic, isEnglish);
    if (node.nodeValue !== translated) node.nodeValue = translated;
  };

  const translateAttributes = (el, isEnglish) => {
    const attrCandidates = ['placeholder', 'title', 'aria-label', 'alt', 'value'];
    attrCandidates.forEach(attr => {
      const current = el.getAttribute(attr);
      if (!current) return;
      const originalKey = `origAttr${attr.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()).replace(/^./, letter => letter.toUpperCase())}`;
      if (!el.dataset[originalKey]) {
        el.dataset[originalKey] = current;
      }
      const translated = translateString(el.dataset[originalKey], isEnglish);
      if (current !== translated) el.setAttribute(attr, translated);
    });
  };

  const applyLanguage = (lang, notify = false) => {
    const isEnglish = lang === 'en';
    document.documentElement.setAttribute('dir', isEnglish ? 'ltr' : 'rtl');
    document.documentElement.setAttribute('lang', lang);
    document.title = translateString(originalPageTitle, isEnglish);
    if (descriptionMeta && originalMetaDescription) {
      descriptionMeta.setAttribute('content', translateString(originalMetaDescription, isEnglish));
    }

    // 1. Process explicit language nodes first
    document.querySelectorAll('.lang-text, [data-ar][data-en]').forEach(el => {
      const text = isEnglish ? el.dataset.en : el.dataset.ar;
      if (text && el.textContent !== text) el.textContent = text;
    });

    document.querySelectorAll('[data-i18n-ar],[data-i18n-en]').forEach(el => {
      const text = isEnglish ? el.dataset.i18nEn : el.dataset.i18nAr;
      if (text && el.textContent !== text) el.textContent = text;
    });

    // 2. Translate select options while preserving their original Arabic labels
    document.querySelectorAll('select option').forEach(opt => {
      if (opt.dataset.ar && opt.dataset.en) {
        const text = isEnglish ? opt.dataset.en : opt.dataset.ar;
        if (opt.textContent !== text) opt.textContent = text;
      } else {
        if (opt.dataset.originalArabic === undefined) {
          opt.dataset.originalArabic = opt.textContent;
        }
        const translated = translateString(opt.dataset.originalArabic, isEnglish);
        if (opt.textContent !== translated) opt.textContent = translated;
      }
    });

    // 3. TreeWalker - STRICTLY reject elements already handled by explicit translation attributes
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toLowerCase();
        if (['script', 'style', 'noscript', 'textarea', 'option', 'select'].includes(tag)) return NodeFilter.FILTER_REJECT;
        if (parent.closest('.lang-text, [data-ar], [data-en], [data-i18n-ar], [data-i18n-en], select, option')) {
          return NodeFilter.FILTER_REJECT;
        }
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let currentNode = walker.nextNode();
    while (currentNode) {
      translateTextNode(currentNode, isEnglish);
      currentNode = walker.nextNode();
    }

    document.querySelectorAll('[placeholder], [title], [aria-label], [alt], input, textarea, button').forEach(el => translateAttributes(el, isEnglish));

    document.querySelectorAll('.lang-dir').forEach(el => {
      el.setAttribute('dir', isEnglish ? 'ltr' : 'rtl');
    });

    if (langLabel) {
      langLabel.textContent = isEnglish ? 'AR' : 'EN';
    }
    if (notify) {
      window.dispatchEvent(new CustomEvent('aqar-language-change', { detail: { language: lang } }));
    }

    try {
      localStorage.setItem('lang', lang);
    } catch (error) {
      if (!(error instanceof DOMException) || !['SecurityError', 'QuotaExceededError'].includes(error.name)) {
        throw error;
      }
      console.warn('Language preference could not be saved in local storage:', error);
    }
  };

  let currentLang = document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'ar';
  langToggleBtn.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
    applyLanguage(currentLang, true);
    if (window.showToast) {
      window.showToast(currentLang === 'en' ? 'Language switched to English' : 'تم تغيير اللغة إلى العربية');
    }
  });

  let savedLang = 'ar';
  try {
    savedLang = localStorage.getItem('lang') === 'en' ? 'en' : 'ar';
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== 'SecurityError') {
      throw error;
    }
    console.warn('Saved language preference could not be read from local storage:', error);
  }
  currentLang = savedLang;
  applyLanguage(savedLang);

  let translationScheduled = false;
  const languageObserver = new MutationObserver((records) => {
    if (currentLang !== 'en' || translationScheduled || !records.some(record => record.addedNodes.length)) return;
    translationScheduled = true;
    window.setTimeout(() => {
      translationScheduled = false;
      applyLanguage(currentLang);
    }, 0);
  });
  languageObserver.observe(document.body, { childList: true, subtree: true });
}

// Initialize all tooltips — clear native title to avoid double tooltip
document.querySelectorAll('[data-tooltip]').forEach(el => {
  el.setAttribute('title', '');
});


// ── Back to Top Button ──────────────────────────────────────
const backToTopBtn = document.getElementById('back-to-top');
if (backToTopBtn) {
  let backToTopTicking = false;

  window.addEventListener('scroll', () => {
    if (!backToTopTicking) {
      window.requestAnimationFrame(() => {
        backToTopBtn.classList.toggle('visible', window.scrollY > 400);
        backToTopTicking = false;
      });
      backToTopTicking = true;
    }
  }, { passive: true });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
