/**
 * المشكاة - صفحة أوقات الصلاة
 */

// ===== تبديل الوضع =====
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

// ===== التاريخ =====
function updateDate() {
    const now = new Date();
    document.getElementById('currentDate').textContent = 
        now.toLocaleDateString('ar-EG', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
}
updateDate();

// ===== قائمة المدن =====
const cities = [
    { name: 'مكة المكرمة', country: 'SA' },
    { name: 'المدينة المنورة', country: 'SA' },
    { name: 'الرياض', country: 'SA' },
    { name: 'جدة', country: 'SA' },
    { name: 'الدمام', country: 'SA' },
    { name: 'القاهرة', country: 'EG' },
    { name: 'الإسكندرية', country: 'EG' },
    { name: 'الدار البيضاء', country: 'MA' },
    { name: 'الرباط', country: 'MA' },
    { name: 'مراكش', country: 'MA' },
    { name: 'طنجة', country: 'MA' },
    { name: 'فاس', country: 'MA' },
    { name: 'تونس', country: 'TN' },
    { name: 'الجزائر', country: 'DZ' },
    { name: 'وهران', country: 'DZ' },
    { name: 'طرابلس', country: 'LY' },
    { name: 'الخرطوم', country: 'SD' },
    { name: 'دمشق', country: 'SY' },
    { name: 'بيروت', country: 'LB' },
    { name: 'عمان', country: 'JO' },
    { name: 'بغداد', country: 'IQ' },
    { name: 'الكويت', country: 'KW' },
    { name: 'الدوحة', country: 'QA' },
    { name: 'مسقط', country: 'OM' },
    { name: 'صنعاء', country: 'YE' },
    { name: 'أبو ظبي', country: 'AE' },
    { name: 'دبي', country: 'AE' },
    { name: 'المنامة', country: 'BH' },
];

let currentCity = JSON.parse(localStorage.getItem('prayerCity')) || cities[0];
let countdownInterval = null;
let refreshInterval = null;

document.getElementById('cityDisplay').textContent = currentCity.name;

// ===== جلب المواقيت =====
async function fetchPrayerTimes(city, date = null) {
    const targetDate = date || new Date();
    const day = targetDate.getDate().toString().padStart(2, '0');
    const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
    const year = targetDate.getFullYear();
    const dateStr = `${day}-${month}-${year}`;
    
    let url;
    if (city.latitude && city.longitude) {
        url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${city.latitude}&longitude=${city.longitude}&method=2`;
    } else {
        url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${encodeURIComponent(city.name)}&country=${city.country}&method=2`;
    }
    
    // محاولة جلب أوقات الصلاة من الكاش فوراً لتشغيل سريع 0ms وبدون إنترنت
    const cacheKey = `cachedPrayerTimings_${city.name}_${dateStr}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const timings = JSON.parse(cached);
            displayPrayerTimes(timings);
            showStatus('success', `تم التحديث (محلي) - ${city.name}`);
        } catch (e) {}
    } else {
        showStatus('loading', 'جاري تحميل المواقيت...');
    }
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('فشل الاتصال بالخادم');
        
        const data = await response.json();
        if (data.code !== 200) throw new Error(data.status || 'خطأ في البيانات');
        
        const timings = data.data.timings;
        
        displayPrayerTimes(timings);
        showStatus('success', `تم التحديث - ${city.name}`);
        
        // حفظ في الكاش المحلي لليوم الحالي والمدينة الحالية
        localStorage.setItem(cacheKey, JSON.stringify(timings));
        localStorage.setItem('cachedPrayerTimings', JSON.stringify(timings)); // كاش مصغر متوافق مع الهوم
        return true;
    } catch (error) {
        console.error('خطأ:', error);
        if (cached) {
            showStatus('success', `وضعية عدم الاتصال - ${city.name}`);
            return true;
        } else {
            showStatus('error', error.message || 'حدث خطأ');
            return false;
        }
    }
}

// ===== عرض المواقيت =====
const prayerNames = {
    Fajr: 'الفجر',
    Dhuhr: 'الظهر',
    Asr: 'العصر',
    Maghrib: 'المغرب',
    Isha: 'العشاء'
};

const prayerKeys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

function displayPrayerTimes(timings) {
    if (typeof checkPrayerNotifications === 'function') {
        checkPrayerNotifications(timings);
    }
    prayerKeys.forEach(key => {
        const timeElement = document.getElementById(`${key}Time`);
        if (timeElement && timings[key]) {
            timeElement.textContent = timings[key];
        }
    });
    
    const now = new Date();
    const prayerTimes = {};
    prayerKeys.forEach(key => {
        if (timings[key]) {
            const timeParts = timings[key].split(':');
            const date = new Date();
            date.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0);
            prayerTimes[key] = date;
        }
    });
    
    let nextPrayer = null;
    let nextPrayerKey = null;
    
    for (const key of prayerKeys) {
        if (prayerTimes[key] && prayerTimes[key] > now) {
            nextPrayer = prayerTimes[key];
            nextPrayerKey = key;
            break;
        }
    }
    
    if (!nextPrayer) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (timings.Fajr) {
            const timeParts = timings.Fajr.split(':');
            tomorrow.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0);
            nextPrayer = tomorrow;
            nextPrayerKey = 'Fajr';
        }
    }
    
    if (nextPrayer && nextPrayerKey) {
        document.getElementById('nextPrayerName').textContent = prayerNames[nextPrayerKey] || nextPrayerKey;
        document.getElementById('nextPrayerTime').textContent = timings[nextPrayerKey] || '--:--';
        updateCountdown(nextPrayer);
        
        document.querySelectorAll('.prayer-item').forEach(el => {
            el.classList.remove('active');
            const prayerKey = el.dataset.prayer;
            if (prayerKey === nextPrayerKey) {
                el.classList.add('active');
            }
        });
    }
    
    prayerKeys.forEach(key => {
        const remainingElement = document.getElementById(`${key}Remaining`);
        if (remainingElement && prayerTimes[key]) {
            const remaining = getTimeRemaining(prayerTimes[key]);
            if (remaining && remaining.total > 0) {
                const hours = remaining.hours > 0 ? `${remaining.hours}س ` : '';
                const minutes = remaining.minutes > 0 ? `${remaining.minutes}د ` : '';
                const seconds = remaining.seconds > 0 ? `${remaining.seconds}ث` : '';
                remainingElement.textContent = hours + minutes + seconds || '0ث';
            } else {
                const isPast = prayerTimes[key] < new Date();
                remainingElement.textContent = isPast ? 'تم' : '--';
            }
        }
    });
}

function getTimeRemaining(targetTime) {
    const now = new Date();
    const diff = targetTime - now;
    if (diff <= 0) return null;
    return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        total: diff
    };
}

function updateCountdown(targetTime) {
    if (countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
        const remaining = getTimeRemaining(targetTime);
        const element = document.getElementById('nextPrayerCountdown');
        
        if (remaining && remaining.total > 0) {
            const h = remaining.hours.toString().padStart(2, '0');
            const m = remaining.minutes.toString().padStart(2, '0');
            const s = remaining.seconds.toString().padStart(2, '0');
            element.textContent = `${h}:${m}:${s}`;
        } else {
            element.textContent = '00:00:00';
            clearInterval(countdownInterval);
            refreshPrayerTimes();
        }
    }, 1000);
}

// ===== تحديث المواقيت =====
async function refreshPrayerTimes() {
    await fetchPrayerTimes(currentCity);
}

// ===== حالة الموقع =====
function showStatus(type, message) {
    const statusElement = document.getElementById('locationStatus');
    const dot = statusElement.querySelector('.status-dot');
    const text = statusElement.querySelector('.status-text');
    
    dot.className = 'status-dot';
    if (type === 'loading') dot.classList.add('loading');
    else if (type === 'success') dot.classList.add('success');
    else if (type === 'error') dot.classList.add('error');
    
    text.textContent = message;
}

// ===== تحديد الموقع =====
async function handleLocationSuccess(cityName, countryCode, lat = null, lng = null) {
    let foundCity = cities.find(c => c.name === cityName);
    if (!foundCity) {
        foundCity = { name: cityName, country: countryCode };
        cities.push(foundCity);
    }
    
    if (lat !== null && lng !== null) {
        foundCity.latitude = lat;
        foundCity.longitude = lng;
    }
    
    currentCity = foundCity;
    localStorage.setItem('prayerCity', JSON.stringify(currentCity));
    document.getElementById('cityDisplay').textContent = cityName;
    
    showStatus('success', `تم تحديد الموقع: ${cityName}`);
    await refreshPrayerTimes();
}

function setModalButtonLoading(isLoading) {
    const btn = document.getElementById('detectLocationModalBtn');
    if (!btn) return;
    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري تحديد الموقع الجغرافي...';
    } else {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-crosshairs"></i> تحديد الموقع تلقائيا';
    }
}

function showModalStatus(type, message) {
    const el = document.getElementById('modalLocationStatus');
    if (!el) return;
    if (type === 'hide') {
        el.style.display = 'none';
        return;
    }
    el.style.display = 'block';
    el.innerHTML = message;
    
    if (type === 'loading') {
        el.style.background = 'rgba(243, 156, 18, 0.1)';
        el.style.color = '#F39C12';
        el.style.border = '1px solid rgba(243, 156, 18, 0.2)';
    } else if (type === 'success') {
        el.style.background = 'rgba(46, 204, 113, 0.1)';
        el.style.color = '#2ECC71';
        el.style.border = '1px solid rgba(46, 204, 113, 0.2)';
    } else if (type === 'error') {
        el.style.background = 'rgba(231, 76, 60, 0.1)';
        el.style.color = '#E74C3C';
        el.style.border = '1px solid rgba(231, 76, 60, 0.2)';
    }
}

// تحديد الموقع الاحتياطي فائق الدقة باستخدام الـ IP والإحداثيات الجغرافية المباشرة
async function detectLocationByIP(isFromModal = false) {
    if (isFromModal) {
        showModalStatus('loading', '<i class="fa-solid fa-circle-notch fa-spin"></i> جاري تحديد الإحداثيات التقريبية عبر الشبكة...');
    } else {
        showStatus('loading', 'جاري تحديد الإحداثيات التقريبية عبر الشبكة...');
    }
    
    let lat = null;
    let lng = null;
    let countryCode = 'MA';
    let cityName = '';

    // 1. محاولة جلب الإحداثيات الدقيقة من ipwho.is
    try {
        const response = await fetch('https://ipwho.is/');
        const data = await response.json();
        if (data && data.success) {
            lat = data.latitude;
            lng = data.longitude;
            countryCode = data.country_code || 'MA';
            cityName = data.city || '';
        }
    } catch (e) {
        console.warn('فشل جلب الموقع من ipwho.is، تجربة البديل:', e);
    }

    // 2. البديل الثاني: ipapi.co
    if (lat === null) {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            if (data && data.latitude) {
                lat = data.latitude;
                lng = data.longitude;
                countryCode = data.country_code || 'MA';
                cityName = data.city || '';
            }
        } catch (e) {
            console.error('فشل جلب الموقع من البديل الثاني أيضاً:', e);
        }
    }

    if (lat !== null && lng !== null) {
        // تعريب اسم المدينة بشكل تلقائي واحترافي عبر الإحداثيات المكتشفة بالـ IP
        try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ar`);
            const data = await response.json();
            cityName = data.city || data.locality || data.principalSubdivision || cityName;
            countryCode = data.countryCode || countryCode;
        } catch (error) {
            console.warn('فشل تعريب اسم المدينة، استخدام الاسم الحالي:', error);
        }

        if (!cityName || cityName.trim() === '') {
            cityName = 'موقعي الحالي';
        }

        // حفظ وتفعيل الموقع عبر الإحداثيات الدقيقة لضمان توافق 100% لمواقيت الصلاة
        await handleLocationSuccess(cityName, countryCode, lat, lng);

        const inIframe = window.self !== window.top;
        if (isFromModal) {
            let successHTML = `<div style="margin-bottom: 8px;"><i class="fa-solid fa-circle-check"></i> تم تحديد موقعك تقديرياً بنجاح: <strong>${cityName}</strong></div>`;
            if (inIframe) {
                successHTML += `
                    <div style="font-size: 11px; opacity: 0.9; line-height: 1.4; border-top: 1px dashed rgba(46, 204, 113, 0.3); padding-top: 6px; margin-top: 6px;">
                        <span style="color:#f39c12;"><i class="fa-solid fa-triangle-exclamation"></i> تنبيه:</span> المتصفح يمنع تحديد الـ GPS الدقيق داخل إطار المعاينة. 
                        <br>
                        <a href="${window.location.href}" target="_blank" style="color: #3498db; text-decoration: underline; font-weight: bold; display: inline-block; margin-top: 4px;">
                            <i class="fa-solid fa-up-right-from-square"></i> افتح التطبيق في نافذة مستقلة لتفعيل الـ GPS
                        </a>
                    </div>
                `;
            }
            showModalStatus('success', successHTML);
            setModalButtonLoading(false);
            
            setTimeout(() => {
                closeCityModal();
                showModalStatus('hide', '');
            }, inIframe ? 5000 : 2000);
        } else {
            showStatus('success', `تم تحديد الموقع تقديرياً: ${cityName}`);
        }
        return true;
    }
    
    // إذا فشل كل شيء، نستخدم مكة المكرمة
    const fallbackCity = cities[0];
    await handleLocationSuccess(fallbackCity.name, fallbackCity.country, fallbackCity.latitude, fallbackCity.longitude);
    if (isFromModal) {
        showModalStatus('error', 'تعذر تحديد موقعك تلقائياً، تم استخدام مكة المكرمة كافتراضي.');
        setModalButtonLoading(false);
    }
    return false;
}

function detectLocation(isFromModal = false) {
    if (isFromModal) {
        setModalButtonLoading(true);
        showModalStatus('loading', '<i class="fa-solid fa-spinner fa-spin"></i> يرجى إعطاء إذن الموقع الجغرافي إذا ظهر لك طلب الإذن في المتصفح...');
    } else {
        showStatus('loading', 'جاري تحديد الموقع الجغرافي عبر الـ GPS...');
    }
    
    if (!navigator.geolocation) {
        console.warn('المتصفح لا يدعم تحديد الموقع، جاري التحويل للموقع عبر الشبكة...');
        detectLocationByIP(isFromModal);
        return;
    }
    
    const optionsCached = {
        enableHighAccuracy: false,
        timeout: 2500,
        maximumAge: 86400000 // حتى 24 ساعة مضت للحصول على موقع فوري ومخزن
    };

    const optionsFresh = {
        enableHighAccuracy: true,
        timeout: 8000, // مهلة 8 ثوانٍ للحصول على GPS دقيق جداً من الهواتف والأجهزة
        maximumAge: 0
    };

    const successCallback = async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        if (isFromModal) {
            showModalStatus('loading', '<i class="fa-solid fa-circle-notch fa-spin"></i> تم التقاط الإحداثيات بنجاح، جاري استخراج اسم المدينة...');
        } else {
            showStatus('loading', 'تم تحديد الإحداثيات، جاري تحديد المدينة...');
        }
        
        let cityName = '';
        let countryCode = 'MA';
        
        // 1. المحاولة الأولى لجلب اسم المدينة عبر BigDataCloud
        try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ar`);
            const data = await response.json();
            cityName = data.city || data.locality || data.principalSubdivision;
            countryCode = data.countryCode || 'MA';
        } catch (error) {
            console.warn('فشل جلب اسم المدينة من BigDataCloud، سنحاول عبر البديل:', error);
        }
        
        // 2. المحاولة الثانية لجلب اسم المدينة عبر OpenStreetMap (Nominatim) كبديل قوي يدعم العربية بالكامل وبدقة فائقة
        if (!cityName || cityName.trim() === '') {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&accept-language=ar`, {
                    headers: { 'User-Agent': 'MishkatPrayerApp/1.0' }
                });
                const data = await response.json();
                if (data && data.address) {
                    cityName = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.state;
                    countryCode = data.address.country_code ? data.address.country_code.toUpperCase() : 'MA';
                }
            } catch (error) {
                console.error('فشل جلب اسم المدينة من البديل Nominatim:', error);
            }
        }
        
        // قيمة افتراضية في أسوأ الحالات لعدم تعطل التطبيق
        if (!cityName) {
            cityName = 'موقعي الحالي';
        }
        
        await handleLocationSuccess(cityName, countryCode, lat, lng);
        
        if (isFromModal) {
            showModalStatus('success', `<i class="fa-solid fa-circle-check"></i> تم تحديد الموقع بنجاح: <strong>${cityName}</strong>`);
            setModalButtonLoading(false);
            setTimeout(() => {
                closeCityModal();
                showModalStatus('hide', '');
            }, 1500);
        }
    };

    const handleFinalError = (error) => {
        console.warn('خطأ في الـ GPS الجغرافي، سيتم التحديد التلقائي البديل والذكي عبر الشبكة:', error);
        
        // بدلاً من الفشل وإظهار رسالة خطأ محبطة، نقوم بالتحديد التلقائي فائق الذكاء عبر الـ IP
        detectLocationByIP(isFromModal);
    };

    // تنفيذ الإجراء بأمان تام وتفادي أي انهيار أو إغلاق فجائي للصفحة
    try {
        // نبدأ بمحاولة سريعة لجلب الموقع من الكاش
        navigator.geolocation.getCurrentPosition(
            successCallback,
            (cacheError) => {
                console.warn('لم يتم العثور على موقع مخزن، جاري محاولة تحديد موقع دقيق...', cacheError);
                if (isFromModal) {
                    showModalStatus('loading', '<i class="fa-solid fa-spinner fa-spin"></i> جاري الاتصال بخدمات تحديد الموقع الجغرافي...');
                }
                
                try {
                    // إذا لم يتوفر موقع مخزن، نطلب موقعاً حديثاً دقيقاً
                    navigator.geolocation.getCurrentPosition(
                        successCallback,
                        (freshError) => {
                            handleFinalError(freshError);
                        },
                        optionsFresh
                    );
                } catch (innerErr) {
                    handleFinalError(innerErr);
                }
            },
            optionsCached
        );
    } catch (outerErr) {
        handleFinalError(outerErr);
    }
}

// ===== تغيير المدينة =====
const cityModal = document.getElementById('cityModal');
const cityModalClose = document.getElementById('cityModalClose');
const cityModalInput = document.getElementById('cityModalInput');
const citySuggestions = document.getElementById('citySuggestions');

function openCityModal() {
    cityModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    cityModalInput.value = '';
    cityModalInput.focus();
    showCitySuggestions('');
}

function closeCityModal() {
    cityModal.classList.remove('active');
    document.body.style.overflow = '';
}

document.getElementById('changeCityBtn').addEventListener('click', openCityModal);
cityModalClose.addEventListener('click', closeCityModal);
cityModal.addEventListener('click', (e) => {
    if (e.target === cityModal) closeCityModal();
});

cityModalInput.addEventListener('input', function() {
    showCitySuggestions(this.value.trim());
});

let searchTimeout = null;

function showCitySuggestions(query) {
    // 1. عرض النتائج المحلية فوراً لسرعة فائقة واستجابة ممتازة
    const filteredLocal = cities.filter(city => city.name.includes(query) || query === '');
    
    let localHtml = filteredLocal.map(city => `
        <button class="city-suggestion" data-city="${city.name}" data-country="${city.country}" data-lat="${city.latitude || ''}" data-lng="${city.longitude || ''}">
            <i class="fa-solid fa-map-pin" style="margin-left: 8px; color: var(--color-primary); opacity: 0.7;"></i>
            ${city.name} (${city.country === 'MA' ? 'المغرب' : city.country})
        </button>
    `).join('');

    if (query === '') {
        citySuggestions.innerHTML = localHtml;
        setupSuggestionClickListeners();
        return;
    }

    // إذا كان هناك نص بحث، نعرض النتائج المحلية ونضيف مؤشر جاري البحث عبر الإنترنت
    citySuggestions.innerHTML = `
        ${localHtml}
        <div id="onlineSearchStatus" style="width:100%; text-align:center; color:var(--color-text-lighter); padding:12px; font-size:13px; border-top:1px dashed rgba(0,0,0,0.1);">
            <i class="fa-solid fa-circle-notch fa-spin"></i> جاري البحث الموسع في جميع مدن وقرى العالم...
        </div>
    `;
    setupSuggestionClickListeners();

    // إلغاء أي طلب بحث معلق (Debounce) لعدم إغراق الخادم بالطلبات
    if (searchTimeout) clearTimeout(searchTimeout);

    searchTimeout = setTimeout(async () => {
        try {
            // البحث عبر Nominatim لمدن وقرى العالم وبدعم كامل للعربية
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=ar&limit=8`, {
                headers: { 'User-Agent': 'MishkatPrayerApp/1.0' }
            });
            const data = await response.json();
            
            const statusEl = document.getElementById('onlineSearchStatus');
            if (!statusEl) return; // تم إغلاق المودال أو تغير البحث

            if (data && data.length > 0) {
                // تصفية النتائج لتجنب التكرار وعرض اسم نظيف ومختصر
                const onlineHtml = data.map(item => {
                    const fullName = item.display_name;
                    // استخراج الاسم القصير (المدينة والمقاطعة والدولة)
                    const parts = fullName.split(',');
                    const cleanName = parts.slice(0, 3).join(',').trim();
                    const countryCode = item.address && item.address.country_code ? item.address.country_code.toUpperCase() : 'Global';
                    
                    return `
                        <button class="city-suggestion online-result" data-city="${parts[0].trim()}" data-full-name="${cleanName}" data-country="${countryCode}" data-lat="${item.lat}" data-lng="${item.lon}">
                            <i class="fa-solid fa-globe" style="margin-left: 8px; color: #3498db;"></i>
                            <strong>${parts[0].trim()}</strong> <span style="font-size:11px; opacity:0.8; display:block; text-align:right; margin-top:2px;">${cleanName}</span>
                        </button>
                    `;
                }).join('');

                statusEl.outerHTML = `
                    <div style="width:100%; text-align:right; color:var(--color-primary); padding:6px 12px 2px; font-size:11px; font-weight:bold; border-top:1px dashed rgba(0,0,0,0.05); letter-spacing:0.5px;">
                        نتائج البحث عبر الإنترنت:
                    </div>
                    ${onlineHtml}
                `;
            } else {
                if (filteredLocal.length === 0) {
                    statusEl.outerHTML = `
                        <div style="width:100%; text-align:center; color:var(--color-text-lighter); padding:12px;">
                            <i class="fa-solid fa-circle-exclamation"></i> لم نجد أي مدينة بهذا الاسم. جرب كتابة اسم المدينة بشكل آخر.
                        </div>
                    `;
                } else {
                    statusEl.remove();
                }
            }
            setupSuggestionClickListeners();
        } catch (error) {
            console.error('خطأ في البحث عن المدينة عبر الإنترنت:', error);
            const statusEl = document.getElementById('onlineSearchStatus');
            if (statusEl) {
                if (filteredLocal.length === 0) {
                    statusEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> حدث خطأ في الاتصال بالإنترنت لبحث المدن.';
                } else {
                    statusEl.remove();
                }
            }
        }
    }, 600); // 600ms debounce
}

function setupSuggestionClickListeners() {
    document.querySelectorAll('.city-suggestion').forEach(btn => {
        // تجنب تكرار المستمعات عن طريق استبدال العنصر بنسخة جديدة منه
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });

    document.querySelectorAll('.city-suggestion').forEach(btn => {
        btn.addEventListener('click', function() {
            const name = this.dataset.city;
            const country = this.dataset.country;
            const fullName = this.dataset.fullName || name;
            const lat = this.dataset.lat;
            const lng = this.dataset.lng;

            if (lat && lng) {
                // مدينة مخصصة بالإحداثيات من الخريطة
                currentCity = {
                    name: fullName,
                    country: country,
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lng)
                };
            } else {
                // مدينة من القائمة المحلية الثابتة
                currentCity = cities.find(c => c.name === name && c.country === country) || { name, country };
            }

            localStorage.setItem('prayerCity', JSON.stringify(currentCity));
            document.getElementById('cityDisplay').textContent = name;
            closeCityModal();
            showStatus('success', `تم التغيير إلى: ${name}`);
            refreshPrayerTimes();
        });
    });
}

document.getElementById('detectLocationModalBtn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    detectLocation(true);
});

// ===== إخفاء الهيدر =====
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

// ===== مشغل الأذان =====
let adhanAudio = null;
let isAdhanPlaying = false;

function initAdhanPlayer() {
    const playBtn = document.getElementById('playAdhanBtn');
    const playText = document.getElementById('playAdhanText');
    const adhanUrl = 'https://download.quranicaudio.com/adhan/adhan_makkah_ali_mulla.mp3';

    if (!playBtn) return;

    playBtn.addEventListener('click', () => {
        if (!adhanAudio) {
            adhanAudio = new Audio(adhanUrl);
            adhanAudio.addEventListener('ended', () => {
                isAdhanPlaying = false;
                playBtn.classList.remove('playing');
                playBtn.innerHTML = '<i class="fa-solid fa-play"></i> <span>تشغيل</span>';
            });
        }

        if (isAdhanPlaying) {
            adhanAudio.pause();
            isAdhanPlaying = false;
            playBtn.classList.remove('playing');
            playBtn.innerHTML = '<i class="fa-solid fa-play"></i> <span>تشغيل</span>';
        } else {
            adhanAudio.play().then(() => {
                isAdhanPlaying = true;
                playBtn.classList.add('playing');
                playBtn.innerHTML = '<i class="fa-solid fa-stop"></i> <span>إيقاف</span>';
            }).catch(err => {
                console.error('Adhan audio failed to play:', err);
                showNotificationToast('تعذر تشغيل الصوت', 'فشل تحميل صوت الأذان، تأكد من اتصالك بالإنترنت.', 'fa-solid fa-circle-exclamation');
            });
        }
    });
}

// ===== أذكار بعد الصلاة =====
const postPrayerAzkar = [
    { text: "أَسْتَغْفِرُ اللهَ (ثَلَاثًا)<br>اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ ذَا الْجَلَالِ وَالْإِكْرَامِ.", count: 3, current: 0, source: "رواه مسلم" },
    { text: "لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ، لَا إِلَهَ إِلَّا اللهُ، وَلَا نَعْبُدُ إِلَّا إِيَّاهُ، لَهُ النِّعْمَةُ وَلَهُ الْفَضْلُ وَلَهُ الثَّنَاءُ الْحَسَنُ.", count: 1, current: 0, source: "رواه مسلم" },
    { text: "سُبْحَانَ اللهِ", count: 33, current: 0, source: "رواه البخاري ومسلم" },
    { text: "الْحَمْدُ للهِ", count: 33, current: 0, source: "رواه البخاري ومسلم" },
    { text: "اللهُ أَكْبَرُ", count: 33, current: 0, source: "رواه البخاري ومسلم" },
    { text: "لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ (لِتَمَامِ الْمِائَةِ)", count: 1, current: 0, source: "رواه مسلم" },
    { text: "أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيمِ<br>﴿اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ﴾", count: 1, current: 0, source: "سورة البقرة - آية الكرسي (تقرأ دبر كل صلاة)" }
];

let activeAzkarIndex = 0;

function renderAzkar() {
    const slider = document.getElementById('azkarSlider');
    if (!slider) return;
    slider.innerHTML = '';
    
    postPrayerAzkar.forEach((zkr, idx) => {
        const slide = document.createElement('div');
        slide.className = `azkar-slide ${idx === activeAzkarIndex ? 'active' : ''}`;
        slide.id = `azkarSlide_${idx}`;
        
        const textDiv = document.createElement('div');
        textDiv.className = 'azkar-text-arabic';
        textDiv.innerHTML = zkr.text;
        
        const sourceSpan = document.createElement('span');
        sourceSpan.className = 'azkar-source';
        sourceSpan.textContent = zkr.source;
        
        const counterWrapper = document.createElement('div');
        counterWrapper.className = 'azkar-counter-wrapper';
        
        const countBtn = document.createElement('button');
        countBtn.className = `btn-azkar-count ${zkr.current >= zkr.count ? 'done' : ''}`;
        countBtn.id = `btnZkrCount_${idx}`;
        
        if (zkr.current >= zkr.count) {
            countBtn.innerHTML = '<i class="fa-solid fa-check"></i> تم الانتهاء';
        } else {
            countBtn.innerHTML = `<i class="fa-solid fa-fingerprint"></i> <span class="count-num">${zkr.current}/${zkr.count}</span>`;
        }
        
        countBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (zkr.current < zkr.count) {
                zkr.current++;
                if (navigator.vibrate) {
                    navigator.vibrate(30);
                }
                
                if (zkr.current >= zkr.count) {
                    countBtn.classList.add('done');
                    countBtn.innerHTML = '<i class="fa-solid fa-check"></i> تم الانتهاء';
                    setTimeout(() => {
                        if (activeAzkarIndex < postPrayerAzkar.length - 1) {
                            navigateAzkar(1);
                        }
                    }, 600);
                } else {
                    countBtn.querySelector('.count-num').textContent = `${zkr.current}/${zkr.count}`;
                }
                updateAzkarProgress();
            }
        });
        
        counterWrapper.appendChild(countBtn);
        
        slide.appendChild(textDiv);
        slide.appendChild(sourceSpan);
        slide.appendChild(counterWrapper);
        
        slider.appendChild(slide);
    });
    
    updateAzkarProgress();
}

function navigateAzkar(direction) {
    const slides = document.querySelectorAll('.azkar-slide');
    if (slides.length === 0) return;
    
    slides[activeAzkarIndex].classList.remove('active');
    
    activeAzkarIndex += direction;
    if (activeAzkarIndex >= postPrayerAzkar.length) {
        activeAzkarIndex = 0;
    } else if (activeAzkarIndex < 0) {
        activeAzkarIndex = postPrayerAzkar.length - 1;
    }
    
    slides[activeAzkarIndex].classList.add('active');
    updateAzkarProgress();
}

function updateAzkarProgress() {
    const progressFill = document.getElementById('azkarProgressFill');
    if (!progressFill) return;
    const percentage = ((activeAzkarIndex + 1) / postPrayerAzkar.length) * 100;
    progressFill.style.width = `${percentage}%`;
}

function initAzkarSlider() {
    renderAzkar();
    
    const prevBtn = document.getElementById('prevAzkarBtn');
    const nextBtn = document.getElementById('nextAzkarBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            navigateAzkar(-1);
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            navigateAzkar(1);
        });
    }
}

// ===== الإشعارات والتنبيهات (5 دقائق قبل الأذان) =====
let notifiedPrayers = {};

function showNotificationToast(title, body, iconClass = 'fa-solid fa-bell') {
    const oldNotif = document.getElementById('prayerNotifToast');
    if (oldNotif) oldNotif.remove();

    const toast = document.createElement('div');
    toast.className = 'prayer-notification-toast';
    toast.id = 'prayerNotifToast';

    toast.innerHTML = `
        <div class="notif-content-wrapper">
            <div class="notif-icon-wrapper">
                <i class="${iconClass}"></i>
            </div>
            <div class="notif-text">
                <span class="notif-title">${title}</span>
                <span class="notif-body">${body}</span>
            </div>
        </div>
        <button class="btn-close-notif" id="closeNotifToastBtn">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    document.body.appendChild(toast);

    // إرسال إشعار نظام حقيقي على الأندرويد عبر كوردوفا (Real Native System Notification)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.notification && window.cordova.plugins.notification.local) {
        try {
            window.cordova.plugins.notification.local.schedule({
                id: Math.floor(Math.random() * 100000),
                title: title,
                text: body,
                foreground: true,
                badge: 1,
                vibrate: true,
                sound: true,
                smallIcon: 'res://icon',
                icon: 'res://icon'
            });
            console.log('🔔 تم إرسال إشعار نظام أندرويد حقيقي: ' + title);
        } catch(err) {
            console.error('❌ فشل إرسال إشعار النظام الحقيقي:', err);
        }
    }

    try {
        const pingAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
        pingAudio.volume = 0.5;
        pingAudio.play();
    } catch(e) {}

    const closeBtn = document.getElementById('closeNotifToastBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.style.animation = 'slideDownIn 0.3s reverse forwards';
            setTimeout(() => toast.remove(), 300);
        });
    }

    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideDownIn 0.3s reverse forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 15000);
}

function checkPrayerNotifications(timings) {
    if (!timings) return;
    
    const now = new Date();
    const todayStr = now.toDateString();
    
    prayerKeys.forEach(key => {
        if (timings[key]) {
            const timeParts = timings[key].split(':');
            const prayerTime = new Date();
            prayerTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
            
            const diffMs = prayerTime - now;
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const notifyKey = `${todayStr}_${key}`;
            
            if (diffMins === 5 && !notifiedPrayers[notifyKey]) {
                notifiedPrayers[notifyKey] = true;
                const arabicName = prayerNames[key] || key;
                showNotificationToast(
                    `اقترب موعد صلاة ${arabicName}`, 
                    `متبقي 5 دقائق فقط على صلاة ${arabicName}. استعد للوضوء والصلاة.`,
                    'fa-solid fa-clock'
                );
            }
        }
    });
}

function getFormattedTodayDate() {
    const targetDate = new Date();
    const day = targetDate.getDate().toString().padStart(2, '0');
    const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
    const year = targetDate.getFullYear();
    return `${day}-${month}-${year}`;
}

// ===== التهيئة =====
async function init() {
    await refreshPrayerTimes();
    
    initAdhanPlayer();
    initAzkarSlider();

    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        refreshPrayerTimes();
        updateDate();
    }, 300000);

    // التحقق من موعد الصلاة كل دقيقة لإرسال تنبيه الـ 5 دقائق
    setInterval(() => {
        const cacheKey = `cachedPrayerTimings_${currentCity.name}_${getFormattedTodayDate()}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const timings = JSON.parse(cached);
                checkPrayerNotifications(timings);
            } catch(e) {}
        }
    }, 60000);
    
    setTimeout(() => {
        if (!localStorage.getItem('prayerCity')) {
            detectLocation();
        }
    }, 3000);
}

init();

console.log('🌙 المشكاة - صفحة أوقات الصلاة');
console.log(`المدينة: ${currentCity.name}`);

// التعامل مع زر الرجوع الفعلي للأندرويد (Cordova backbutton)
document.addEventListener('deviceready', () => {
    // طلب صلاحيات الإشعارات لنظام أندرويد 13 فما فوق
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.notification && window.cordova.plugins.notification.local) {
        window.cordova.plugins.notification.local.hasPermission((granted) => {
            if (!granted) {
                window.cordova.plugins.notification.local.requestPermission((hasPermission) => {
                    console.log('📱 صلاحية الإشعارات الأصلية في صفحة الصلاة:', hasPermission);
                });
            }
        });
    }

    document.addEventListener('backbutton', (e) => {
        const cityModal = document.getElementById('cityModal');
        if (cityModal && cityModal.classList.contains('active')) {
            closeCityModal();
            return;
        }
        
        // العودة للرئيسية
        window.location.href = '/index.html';
    }, false);
}, false);