/**
 * المشكاة - الصفحة الرئيسية
 */

// ============================================
// 1. تبديل الوضع (ليلي / نهاري)
// ============================================
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('i');

let currentTheme = localStorage.getItem('theme') || 'light';
applyTheme(currentTheme);

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.className = 'fa-solid fa-sun';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeIcon.className = 'fa-solid fa-moon';
    }
    localStorage.setItem('theme', theme);
    currentTheme = theme;
}

themeToggle.addEventListener('click', () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    themeToggle.style.transform = 'rotate(180deg)';
    setTimeout(() => themeToggle.style.transform = 'rotate(0deg)', 300);
});

// ============================================
// 2. خوارزمية حساب التاريخ الهجري حسب البلد والموقع (مع دعم كامل للأوفلاين)
// ============================================
function calculateHijriDate(date = new Date()) {
    try {
        const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        let formatted = formatter.format(date);
        formatted = formatted.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
        formatted = formatted.replace(/،/g, '').replace(/\s*هـ\s*/g, '').replace(/\s+/g, ' ').trim();
        if (formatted) return formatted;
    } catch (e) {}

    const d = new Date(date);
    let day = d.getDate();
    let month = d.getMonth() + 1;
    let year = d.getFullYear();

    if (month < 3) {
        year -= 1;
        month += 12;
    }

    let a = Math.floor(year / 100);
    let b = 2 - a + Math.floor(a / 4);
    let jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;

    let mydays = jd - 1948440 + 10632;
    let n = Math.floor((mydays - 1) / 10631);
    mydays = mydays - 10631 * n + 354;
    let j = (Math.floor((10985 - mydays) / 5316)) * (Math.floor((50 * mydays) / 17719)) + (Math.floor(mydays / 5670)) * (Math.floor((43 * mydays) / 15238));
    mydays = mydays - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    let monthH = Math.floor((24 * mydays) / 709);
    let dayH = mydays - Math.floor((709 * monthH) / 24);
    let yearH = 30 * n + j - 30;

    const hijriMonths = [
        "محرم", "صفر", "ربيع الأول", "ربيع الآخر",
        "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
        "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
    ];

    const arabicDays = [
        "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"
    ];

    const weekday = arabicDays[d.getDay()];
    const hMonth = hijriMonths[monthH - 1] || hijriMonths[0];

    return `${weekday} ${dayH} ${hMonth} ${yearH}`;
}

async function updateDates() {
    const hijriEl = document.getElementById('hijriDate');
    
    // 1. حساب وتحميل أسرع تاريخ مخزن محلياً فوراً
    const cachedHijri = localStorage.getItem('cachedHijriDate');
    if (cachedHijri && hijriEl) {
        hijriEl.textContent = cachedHijri;
    } else if (hijriEl) {
        hijriEl.textContent = calculateHijriDate(new Date());
    }

    // 2. تجديد التاريخ الهجري بدقة حسب البلد المعتمد لمواقيت الصلاة
    try {
        const savedCity = localStorage.getItem('prayerCity');
        const city = savedCity ? JSON.parse(savedCity) : { name: 'مكة المكرمة', country: 'SA' };

        const now = new Date();
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = now.getFullYear();

        let url;
        if (city.latitude && city.longitude) {
            url = `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${city.latitude}&longitude=${city.longitude}&method=2`;
        } else {
            url = `https://api.aladhan.com/v1/timingsByCity/${day}-${month}-${year}?city=${encodeURIComponent(city.name)}&country=${city.country}&method=2`;
        }

        const response = await fetch(url);
        const data = await response.json();
        if (data.code === 200 && data.data && data.data.date && data.data.date.hijri) {
            const h = data.data.date.hijri;
            const formatted = `${h.weekday.ar} ${parseInt(h.day, 10)} ${h.month.ar} ${h.year}`;
            if (hijriEl) hijriEl.textContent = formatted;
            localStorage.setItem('cachedHijriDate', formatted);
        }
    } catch (error) {
        // الاتصال مقطوع: الحفاظ على النتيجة المحسوبة أوفلاين
    }
}
updateDates();

// ============================================
// 3. جلب مواقيت الصلاة المصغرة (دعم كامل للأوفلاين)
// ============================================
async function fetchMiniPrayerTimes() {
    // تحميل أوقات الصلاة المخزنة
    const cachedTimings = localStorage.getItem('cachedPrayerTimings');
    if (cachedTimings) {
        try {
            const timings = JSON.parse(cachedTimings);
            if (document.getElementById('miniFajr')) document.getElementById('miniFajr').textContent = timings.Fajr;
            if (document.getElementById('miniDhuhr')) document.getElementById('miniDhuhr').textContent = timings.Dhuhr;
            if (document.getElementById('miniAsr')) document.getElementById('miniAsr').textContent = timings.Asr;
            if (document.getElementById('miniMaghrib')) document.getElementById('miniMaghrib').textContent = timings.Maghrib;
            if (document.getElementById('miniIsha')) document.getElementById('miniIsha').textContent = timings.Isha;
        } catch (e) {}
    }

    try {
        const savedCity = localStorage.getItem('prayerCity');
        const city = savedCity ? JSON.parse(savedCity) : { name: 'مكة المكرمة', country: 'SA' };
        
        const miniLoc = document.getElementById('miniLocationDisplay');
        if (miniLoc) {
            miniLoc.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${city.name}`;
        }
        
        const now = new Date();
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = now.getFullYear();
        
        let url;
        if (city.latitude && city.longitude) {
            url = `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${city.latitude}&longitude=${city.longitude}&method=2`;
        } else {
            url = `https://api.aladhan.com/v1/timingsByCity/${day}-${month}-${year}?city=${encodeURIComponent(city.name)}&country=${city.country}&method=2`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 200) {
            const timings = data.data.timings;
            if (document.getElementById('miniFajr')) document.getElementById('miniFajr').textContent = timings.Fajr;
            if (document.getElementById('miniDhuhr')) document.getElementById('miniDhuhr').textContent = timings.Dhuhr;
            if (document.getElementById('miniAsr')) document.getElementById('miniAsr').textContent = timings.Asr;
            if (document.getElementById('miniMaghrib')) document.getElementById('miniMaghrib').textContent = timings.Maghrib;
            if (document.getElementById('miniIsha')) document.getElementById('miniIsha').textContent = timings.Isha;
            
            if (data.data && data.data.date && data.data.date.hijri) {
                const h = data.data.date.hijri;
                const formattedHijri = `${h.weekday.ar} ${parseInt(h.day, 10)} ${h.month.ar} ${h.year}`;
                const hijriEl = document.getElementById('hijriDate');
                if (hijriEl) hijriEl.textContent = formattedHijri;
                localStorage.setItem('cachedHijriDate', formattedHijri);
            }

            localStorage.setItem('cachedPrayerTimings', JSON.stringify(timings));
        }
    } catch (error) {
        console.log('وضع عدم الاتصال: استخدام الأوقات المخزنة محلياً.');
    }
}
fetchMiniPrayerTimes();

// ============================================
// التحميل والتخزين المسبق لأصوات الأذان في ذاكرة التطبيق (CacheStorage)
// ============================================
function precacheAdhanAudioFiles() {
    if ('caches' in window) {
        const audioFiles = [
            '/audio/adhan_makkah.mp3',
            '/audio/adhan_qatami.mp3',
            '/audio/adhan_afasy.mp3'
        ];
        caches.open('mishkat-cache-v3').then(cache => {
            audioFiles.forEach(file => {
                cache.match(file).then(res => {
                    if (!res && navigator.onLine) {
                        cache.add(file).catch(err => console.log('Precache audio info:', err));
                    }
                });
            });
        });
    }
}
if (document.readyState === 'complete') {
    precacheAdhanAudioFiles();
} else {
    window.addEventListener('load', precacheAdhanAudioFiles);
}

// ============================================
// 4. التنبيهات السريعة (Toast System)
// ============================================
function showToast(message) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    container.innerHTML = '';
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.25s ease forwards';
        setTimeout(() => toast.remove(), 250);
    }, 2500);
}
window.showToast = showToast;

function openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================
// 5. مودال البروفايل
// ============================================
const profileBtn = document.getElementById('profileBtn');
const profileModal = document.getElementById('profileModal');
const profileClose = document.getElementById('profileClose');

if (profileBtn) profileBtn.addEventListener('click', () => openModal(profileModal));
if (profileClose) profileClose.addEventListener('click', () => closeModal(profileModal));

if (profileModal) {
    profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) closeModal(profileModal);
    });
}

document.getElementById('profileSave')?.addEventListener('click', () => {
    const data = {
        name: document.getElementById('profileName')?.value || '',
        city: document.getElementById('profileCity')?.value || '',
        country: document.getElementById('profileCountry')?.value || '',
    };
    localStorage.setItem('profile', JSON.stringify(data));
    showAppToast('تم حفظ الملف الشخصي بنجاح', 'success');
    closeModal(profileModal);
});

const savedProfile = localStorage.getItem('profile');
if (savedProfile) {
    try {
        const data = JSON.parse(savedProfile);
        const nameInput = document.getElementById('profileName');
        const cityInput = document.getElementById('profileCity');
        const countryInput = document.getElementById('profileCountry');
        if (nameInput) nameInput.value = data.name || '';
        if (cityInput) cityInput.value = data.city || '';
        if (countryInput) countryInput.value = data.country || '';
    } catch(e) {}
}

// ============================================
// 6. التنقل النشط
// ============================================
const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(item => {
    item.addEventListener('click', function(e) {
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
        if (this.getAttribute('data-nav') === 'home') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
});

// ============================================
// 7. إخفاء الهيدر
// ============================================
let lastScroll = 0;
const header = document.getElementById('mainHeader');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 80 && currentScroll > lastScroll) {
        header.style.transform = 'translateY(-100%)';
    } else {
        header.style.transform = 'translateY(0)';
    }
    lastScroll = currentScroll;
});

// ============================================
// 8. آخر قراءة (مربوطة فعلياً بصفحة القرآن)
// ============================================
function buildQuranPageUrl(data) {
    const params = new URLSearchParams({
        page: data.page,
        surah: data.surahNumber,
        name: data.surahName,
    });
    return `./quran/page.html?${params.toString()}`;
}

function loadRecentReading() {
    const recentContent = document.getElementById('recentContent');
    if (!recentContent) return;

    const raw = localStorage.getItem('lastRead');
    if (!raw) return; // تبقى حالة "لم تقرأ شيئاً بعد" الافتراضية في HTML

    try {
        const data = JSON.parse(raw);
        if (!data || !data.page || !data.surahName) return;

        const url = buildQuranPageUrl(data);
        recentContent.innerHTML = `
            <a class="recent-item" href="${url}">
                <div class="recent-item-icon">
                    <i class="fa-solid fa-book-open"></i>
                </div>
                <div class="recent-item-info">
                    <span class="recent-item-surah">سورة ${data.surahName}</span>
                    <span class="recent-item-page">صفحة ${data.page}</span>
                </div>
                <i class="fa-solid fa-chevron-left recent-item-arrow"></i>
            </a>
        `;
    } catch (e) {
        console.warn('⚠️ تعذّر قراءة آخر قراءة', e);
    }
}
loadRecentReading();

document.getElementById('viewAllRecent')?.addEventListener('click', () => {
    const raw = localStorage.getItem('lastRead');
    if (raw) {
        try {
            const data = JSON.parse(raw);
            window.location.href = buildQuranPageUrl(data);
            return;
        } catch (e) {}
    }
    window.location.href = './quran/index.html';
});

// ============================================
// 9. تحديث أوقات الصلاة كل 5 دقائق
// ============================================
setInterval(fetchMiniPrayerTimes, 300000);

// ============================================
// 10. تحديث التاريخ كل دقيقة
// ============================================
setInterval(updateDates, 60000);

// ============================================
// 11. الأدعية من 100dua.json
// ============================================
let allDua = [];
let duaIndex = 0;
let duaInterval = null;

async function loadDua() {
    try {
        const response = await fetch('./data/json/100dua.json');
        const data = await response.json();
        allDua = data;
        displayDua(0);
        startDuaRotation();
    } catch (error) {
        console.error('خطأ في تحميل الأدعية:', error);
        document.getElementById('randomDua').textContent = 'اللهم إني أسألك العفو والعافية';
        document.getElementById('duaSource').textContent = 'دعاء مبارك';
    }
}

function displayDua(index) {
    if (allDua.length === 0) return;
    
    const duaItem = allDua[index % allDua.length];
    const duaText = document.getElementById('randomDua');
    const duaSource = document.getElementById('duaSource');
    
    if (duaItem && duaItem.duaa && duaItem.duaa.length > 0) {
        duaText.textContent = duaItem.duaa[0].text;
        
        // عرض المصدر
        const source = duaItem.duaa[0].source;
        let sourceText = '';
        if (source) {
            if (source.type === 'quran') {
                const ref = source.references[0];
                if (ref) {
                    sourceText = ` ${ref.surah.name} - ${ref.ayah.from}`;
                }
            } else if (source.type === 'hadith') {
                const ref = source.references[0];
                if (ref) {
                    sourceText = ` ${ref.book || ''} ${ref.numberOrPage || ''}`;
                }
            }
        }
        duaSource.textContent = sourceText || 'دعاء مبارك';
    }
    
    // تحديث النقاط
    updateDots('duaDots', index, allDua.length);
    duaIndex = index;
}

function startDuaRotation() {
    if (duaInterval) clearInterval(duaInterval);
    duaInterval = setInterval(() => {
        const nextIndex = (duaIndex + 1) % allDua.length;
        displayDua(nextIndex);
    }, 30000); // 30 ثانية (نصف دقيقة)
}

// ============================================
// 12. آية وعبرة من ayat&ebra.json
// ============================================
let allVerses = [];
let verseIndex = 0;
let verseInterval = null;

async function loadVerse() {
    try {
        const response = await fetch('./data/json/ayat&ebra.json');
        const data = await response.json();
        allVerses = data;
        displayVerse(0);
        startVerseRotation();
    } catch (error) {
        console.error('خطأ في تحميل الآيات:', error);
        document.getElementById('verseText').textContent = '"وَمَنْ يَتَّقِ اللَّهَ يَجْعَلْ لَهُ مَخْرَجًا"';
        document.getElementById('verseRef').textContent = 'الطلاق - 2';
        document.getElementById('verseLesson').textContent = 'التقوى باب الفرج، من تمسك بها فتح الله له من حيث لا يحتسب';
    }
}

function displayVerse(index) {
    if (allVerses.length === 0) return;
    
    const verse = allVerses[index % allVerses.length];
    const verseText = document.getElementById('verseText');
    const verseRef = document.getElementById('verseRef');
    const verseLesson = document.getElementById('verseLesson');
    
    if (verse) {
        verseText.textContent = verse.title1 || '';
        verseRef.textContent = verse.title2 || 'آية قرآنية';
        verseLesson.textContent = verse.title3 || 'تأمل في آيات الله وتدبر معانيها';
    }
    
    updateDots('verseDots', index, allVerses.length);
    verseIndex = index;
}

function startVerseRotation() {
    if (verseInterval) clearInterval(verseInterval);
    verseInterval = setInterval(() => {
        const nextIndex = (verseIndex + 1) % allVerses.length;
        displayVerse(nextIndex);
    }, 30000); // 30 ثانية (نصف دقيقة)
}

// ============================================
// 13. تحديث النقاط
// ============================================
function updateDots(containerId, activeIndex, total) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const dots = container.querySelectorAll('.dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === (activeIndex % total));
    });
}

// ============================================
// 14. النقر على النقاط للتبديل
// ============================================
document.addEventListener('click', function(e) {
    // نقاط الأدعية
    if (e.target.closest('#duaDots .dot')) {
        const dot = e.target.closest('.dot');
        const index = parseInt(dot.dataset.index);
        if (!isNaN(index) && allDua.length > 0) {
            displayDua(index % allDua.length);
            // إعادة تعيين المؤقت
            startDuaRotation();
        }
    }
    
    // نقاط الآيات
    if (e.target.closest('#verseDots .dot')) {
        const dot = e.target.closest('.dot');
        const index = parseInt(dot.dataset.index);
        if (!isNaN(index) && allVerses.length > 0) {
            displayVerse(index % allVerses.length);
            startVerseRotation();
        }
    }
});

// ============================================
// 15. دعم التمرير السريع (Swipe Gestures)
// ============================================
function addSwipeSupport(elementId, onSwipeLeft, onSwipeRight) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    
    el.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    el.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;
        handleGesture();
    }, { passive: true });
    
    function handleGesture() {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // التأكد من أن الحركة أفقية وبمساحة كافية (أكبر من 50 بكسل)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                if (onSwipeRight) onSwipeRight();
            } else {
                if (onSwipeLeft) onSwipeLeft();
            }
        }
    }
}

// تشغيل التمرير لبطاقة الأدعية
addSwipeSupport('duaCard', () => {
    // تمرير لليسار -> التالي
    if (allDua.length > 0) {
        const nextIndex = (duaIndex + 1) % allDua.length;
        displayDua(nextIndex);
        startDuaRotation();
    }
}, () => {
    // تمرير لليمين -> السابق
    if (allDua.length > 0) {
        const prevIndex = (duaIndex - 1 + allDua.length) % allDua.length;
        displayDua(prevIndex);
        startDuaRotation();
    }
});

// تشغيل التمرير لبطاقة آية وعبرة
addSwipeSupport('verseCard', () => {
    // تمرير لليسار -> التالي
    if (allVerses.length > 0) {
        const nextIndex = (verseIndex + 1) % allVerses.length;
        displayVerse(nextIndex);
        startVerseRotation();
    }
}, () => {
    // تمرير لليمين -> السابق
    if (allVerses.length > 0) {
        const prevIndex = (verseIndex - 1 + allVerses.length) % allVerses.length;
        displayVerse(prevIndex);
        startVerseRotation();
    }
});

// ============================================
// 16. التهيئة
// ============================================
loadDua();
loadVerse();

// ============================================
// 17. نافذة الفرقان المنبثقة وإدارة الأندرويد
// ============================================

// عرض نافذة التحديث لمرة واحدة
document.addEventListener('DOMContentLoaded', () => {
    const popup = document.getElementById('furqanUpdatePopup') || document.getElementById('mishkatUpdatePopup');
    const closeBtn = document.getElementById('closeFurqanPopup') || document.getElementById('closeMishkatPopup');
    
    if (popup && closeBtn) {
        const hasSeenWelcome = localStorage.getItem('furqan_update_v3_5');
        if (!hasSeenWelcome) {
            setTimeout(() => {
                popup.classList.add('active');
            }, 800);
        }
        
        closeBtn.addEventListener('click', () => {
            popup.classList.remove('active');
            localStorage.setItem('furqan_update_v3_5', 'true');
        });
    }
});

// التعامل مع زر الرجوع الفعلي للأندرويد (Cordova backbutton)
document.addEventListener('deviceready', () => {
    console.log('📱 تم تحميل كوردوفا بنجاح وجاهز للتشغيل على الأندرويد');
    
    // طلب صلاحيات الإشعارات لنظام أندرويد 13 فما فوق
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.notification && window.cordova.plugins.notification.local) {
        window.cordova.plugins.notification.local.hasPermission((granted) => {
            if (!granted) {
                window.cordova.plugins.notification.local.requestPermission((hasPermission) => {
                    console.log('📱 صلاحية الإشعارات الأصلية:', hasPermission);
                });
            }
        });
    }
    
    document.addEventListener('backbutton', (e) => {
        // إذا كان هناك أي مودال مفتوح، نقوم بإغلاقه بدلاً من إغلاق التطبيق
        const activeModals = document.querySelectorAll('.modal-overlay.active, .furqan-popup-overlay.active, .mishkat-popup-overlay.active, .city-modal.active');
        if (activeModals.length > 0) {
            activeModals.forEach(modal => {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            });
            return;
        }

        // إذا كنا لست في الصفحة الرئيسية، نرجع للخلف في التاريخ بدلاً من الخروج
        const path = window.location.pathname;
        const isHomePage = path.endsWith('index.html') || path === '/' || path.split('/').pop() === '';
        if (!isHomePage) {
            window.history.back();
        } else {
            // في الصفحة الرئيسية، يخرج من التطبيق بأمان
            if (navigator.app && navigator.app.exitApp) {
                navigator.app.exitApp();
            }
        }
    }, false);
}, false);

console.log('✨ منصة الفرقان - الرقمية الشاملة بالهوية الزجاجية جاهزة بالكامل');
console.log('📖 تم تحميل الأدعية والآيات بالخط المغربي الأصيل');