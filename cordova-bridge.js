/**
 * المشكاة - وحدة المنسق الخلفي للويب والأندرويد (Cordova Bridge Manager)
 * تتكفل بالتنسيق التام بين تطبيق الويب وبيئة أندرويد الأصلية (Notifications, Audio, Background, BackButton)
 */

(function () {
    'use strict';

    window.MishkatBridge = {
        isCordova: false,

        init: function () {
            document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
            this.setupWebFallbacks();
        },

        onDeviceReady: function () {
            this.isCordova = true;
            console.log('🚀 [المشكاة] تم الاتصال مع محرك أندرويد بنجاح (Device Ready)');

            this.configureStatusBar();
            this.requestAndroidPermissions();
            this.setupNotificationHandlers();
            this.setupBackButton();
            this.configureKeepAlive();
        },

        configureStatusBar: function () {
            if (window.StatusBar) {
                window.StatusBar.backgroundColorByHexString('#8c6239');
                window.StatusBar.styleLightContent();
            }
        },

        requestAndroidPermissions: function () {
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.notification && window.cordova.plugins.notification.local) {
                window.cordova.plugins.notification.local.hasPermission(function (granted) {
                    if (!granted) {
                        window.cordova.plugins.notification.local.requestPermission(function (hasPermission) {
                            console.log('📱 [أندرويد] حالة صلاحيات الإشعارات:', hasPermission);
                        });
                    }
                });
            }
        },

        setupNotificationHandlers: function () {
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.notification && window.cordova.plugins.notification.local) {
                var localNotif = window.cordova.plugins.notification.local;

                // عند النقر على إشعار الأذان من ستارة الإشعارات في أندرويد
                localNotif.on('click', function (notification) {
                    console.log('🔔 [أندرويد] تم فتح التطبيق من الإشعار:', notification.id);
                    if (notification.data && notification.data.reciterUrl) {
                        try {
                            var adhanAudio = new Audio(notification.data.reciterUrl);
                            adhanAudio.play().catch(function(err) {
                                console.warn('لم يتم تشغيل صوت الإشعار تلقائياً:', err);
                            });
                        } catch (e) {
                            console.error('خطأ في تشغيل صوت الأذان من الإشعار:', e);
                        }
                    }
                    if (window.location.pathname.indexOf('prayer') === -1) {
                        window.location.href = '/prayer/index.html';
                    }
                });
            }
        },

        setupBackButton: function () {
            document.addEventListener('backbutton', function (e) {
                // إغلاق أي المودالات النشطة أولاً
                var activeModal = document.querySelector('.modal-overlay.active, .modal.active');
                if (activeModal) {
                    activeModal.classList.remove('active');
                    document.body.style.overflow = '';
                    return;
                }

                // إذا كنا في صفحة فرعية، نرجع للرئيسية
                if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
                    window.location.href = '/index.html';
                } else {
                    // إذا كنا في الصفحة الرئيسية، تأكيد الخروج أو تصغير التطبيق
                    if (navigator.app && navigator.app.exitApp) {
                        navigator.app.exitApp();
                    }
                }
            }, false);
        },

        configureKeepAlive: function () {
            // تفعيل نمط التشغيل بالخلفية لضمان مواقيت الأذان والدقة المتناهية
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.backgroundMode) {
                try {
                    window.cordova.plugins.backgroundMode.enable();
                    window.cordova.plugins.backgroundMode.setDefaults({
                        title: 'تطبيق المشكاة يعمل في الخلفية',
                        text: 'يتم متابعة مواقيت الصلاة والأذان بدقة',
                        icon: 'icon',
                        color: '8C6239',
                        resume: true,
                        hidden: true,
                        bigText: true
                    });
                } catch (e) {
                    console.warn('BackgroundMode plugin not initialized:', e);
                }
            }
        },

        setupWebFallbacks: function () {
            // دعم التنبيهات الافتراضية في المتصفحات والويب
            if (!('Notification' in window)) return;
            if (Notification.permission === 'default') {
                try {
                    Notification.requestPermission();
                } catch (e) {}
            }
        }
    };

    window.MishkatBridge.init();
})();
