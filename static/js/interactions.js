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
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('open');
    navLinks.classList.toggle('open');
  });
  
  // Close menu when clicking a link
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar-nav') && !e.target.closest('.menu-toggle')) {
      menuToggle.classList.remove('open');
      navLinks.classList.remove('open');
    }
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
    'تصفية العقارات': 'Property filtering',
    'مقياس البنية التحتية': 'Infrastructure scale',
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
  };

  const translateTextNode = (node, isEnglish) => {
    if (!node || !node.nodeValue || !node.nodeValue.trim()) return;
    if (node._originalText === undefined) {
      node._originalText = node.nodeValue;
    }

    const originalText = node._originalText;
    if (!isEnglish) {
      node.nodeValue = originalText;
      return;
    }

    let translated = originalText;
    const sortedKeys = Object.keys(translationMap).sort((a, b) => b.length - a.length);
    sortedKeys.forEach((arabic) => {
      const english = translationMap[arabic];
      translated = translated.split(arabic).join(english);
    });
    node.nodeValue = translated;
  };

  const translateAttributes = (el, isEnglish) => {
    const attrCandidates = ['placeholder', 'title', 'aria-label', 'alt', 'value'];
    attrCandidates.forEach(attr => {
      const current = el.getAttribute(attr);
      if (!current) return;
      if (isEnglish) {
        let translated = current;
        const sortedKeys = Object.keys(translationMap).sort((a, b) => b.length - a.length);
        sortedKeys.forEach(arabic => {
          const english = translationMap[arabic];
          translated = translated.split(arabic).join(english);
        });
        el.setAttribute(attr, translated);
      } else {
        if (el.dataset[`original${attr.charAt(0).toUpperCase() + attr.slice(1)}`]) {
          el.setAttribute(attr, el.dataset[`original${attr.charAt(0).toUpperCase() + attr.slice(1)}`]);
        } else {
          el.dataset[`original${attr.charAt(0).toUpperCase() + attr.slice(1)}`] = current;
        }
      }
    });
  };

  const applyLanguage = (lang) => {
    const isEnglish = lang === 'en';
    document.documentElement.setAttribute('dir', isEnglish ? 'ltr' : 'rtl');
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('lang', lang);

    document.querySelectorAll('.lang-text, [data-ar][data-en]').forEach(el => {
      const text = isEnglish ? el.dataset.en : el.dataset.ar;
      if (text) el.textContent = text;
    });

    document.querySelectorAll('[data-i18n-ar],[data-i18n-en],[data-i18n-placeholder-ar],[data-i18n-placeholder-en],[data-i18n-title-ar],[data-i18n-title-en],[data-i18n-aria-label-ar],[data-i18n-aria-label-en],[data-i18n-alt-ar],[data-i18n-alt-en],[data-i18n-value-ar],[data-i18n-value-en]').forEach(el => {
      const text = isEnglish ? el.dataset.i18nEn : el.dataset.i18nAr;
      if (text) el.textContent = text;
      translateAttributes(el, isEnglish);
    });

    document.querySelectorAll('[data-auto-i18n]').forEach(el => {
      const text = isEnglish ? el.dataset.i18nEn : el.dataset.i18nAr;
      if (text) el.textContent = text;
    });

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toLowerCase();
        if (['script', 'style', 'noscript', 'textarea'].includes(tag)) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let currentNode = walker.nextNode();
    while (currentNode) {
      translateTextNode(currentNode, isEnglish);
      currentNode = walker.nextNode();
    }

    document.querySelectorAll('input, textarea, button, select').forEach(el => translateAttributes(el, isEnglish));

    document.querySelectorAll('select option').forEach(opt => {
      if (!opt.dataset.originalText) {
        opt.dataset.originalText = opt.textContent.trim();
      }
      if (isEnglish) {
        let translated = opt.dataset.originalText;
        Object.keys(translationMap).forEach(arabic => {
          const english = translationMap[arabic];
          translated = translated.split(arabic).join(english);
        });
        opt.textContent = translated;
      } else {
        opt.textContent = opt.dataset.originalText;
      }
    });

    document.querySelectorAll('.lang-dir').forEach(el => {
      el.setAttribute('dir', isEnglish ? 'ltr' : 'rtl');
    });

    if (langLabel) {
      langLabel.textContent = isEnglish ? 'AR' : 'EN';
    }
  };

  const savedLang = localStorage.getItem('lang') || 'ar';
  applyLanguage(savedLang);

  langToggleBtn.addEventListener('click', () => {
    const currentLang = document.documentElement.getAttribute('lang') || 'ar';
    const nextLang = currentLang === 'en' ? 'ar' : 'en';
    applyLanguage(nextLang);
    if (window.showToast) {
      window.showToast(nextLang === 'en' ? 'Language switched to English' : 'تم تغيير اللغة إلى العربية');
    }
  });
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

