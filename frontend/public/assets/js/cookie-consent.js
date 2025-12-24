/**
 * Tanyarat - Cookie Consent & Settings Manager
 * เวอร์ชัน 1.0.0
 */

(function() {
  // Config - ตั้งค่าเริ่มต้นของคุกกี้
  const cookieConfig = {
    necessary: {
      name: 'คุกกี้จำเป็น',
      desc: 'คุกกี้ประเภทนี้มีความจำเป็นต่อการทำงานของเว็บไซต์ ไม่สามารถปิดได้',
      required: true,
      default: true
    },
    functional: {
      name: 'คุกกี้ฟังก์ชัน',
      desc: 'คุกกี้เหล่านี้ช่วยให้เว็บไซต์จดจำการตั้งค่าและตัวเลือกต่างๆ ที่คุณเลือก',
      required: false,
      default: true
    },
    analytics: {
      name: 'คุกกี้วิเคราะห์',
      desc: 'ช่วยให้เราเข้าใจว่าผู้ใช้โต้ตอบกับเว็บไซต์ของเราอย่างไร เพื่อปรับปรุงประสบการณ์',
      required: false,
      default: true
    },
    marketing: {
      name: 'คุกกี้การตลาด',
      desc: 'ใช้เพื่อติดตามผู้เข้าชมเว็บไซต์ และแสดงโฆษณาที่เกี่ยวข้องและน่าสนใจ',
      required: false,
      default: false
    }
  };

  // อายุของคุกกี้ (วัน)
  const COOKIE_EXPIRY_DAYS = 365;

  // DOM Elements
  let consentBanner;
  let settingsModal;
  let settingsToggle;

  // สร้าง Cookie Consent Banner
  function createConsentBanner() {
    const banner = document.createElement('div');
    banner.className = 'cookie-consent-container hidden';
    banner.id = 'cookie-consent-banner';
    banner.innerHTML = `
      <div class="cookie-consent-icon">
        <i class="fa fa-cog"></i>
      </div>
      <h3 class="cookie-consent-title">การใช้คุกกี้</h3>
      <p class="cookie-consent-text">
        เว็บไซต์นี้ใช้คุกกี้เพื่อพัฒนาประสบการณ์การใช้งานของคุณ 
        เราใช้คุกกี้เพื่อมอบเนื้อหาและโฆษณาที่เหมาะสม ตลอดจนวิเคราะห์การเข้าชมเว็บไซต์
      </p>
      <div class="cookie-consent-buttons">
        <button class="cookie-accept-btn">ยอมรับทั้งหมด</button>
        <button class="cookie-settings-btn">ตั้งค่าคุกกี้</button>
      </div>
    `;
    document.body.appendChild(banner);
    return banner;
  }

  // สร้าง Settings Toggle Button
  function createSettingsToggle() {
    const toggle = document.createElement('button');
    toggle.className = 'cookie-settings-toggle';
    toggle.id = 'cookie-settings-toggle';
    toggle.innerHTML = '<i class="fa fa-cog"></i>';
    toggle.setAttribute('aria-label', 'ตั้งค่าคุกกี้');
    toggle.setAttribute('title', 'ตั้งค่าคุกกี้');
    document.body.appendChild(toggle);
    return toggle;
  }

  // สร้าง Settings Modal
  function createSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'cookie-modal';
    
    let categoriesHTML = '';
    
    for (const [key, value] of Object.entries(cookieConfig)) {
      categoriesHTML += `
        <div class="cookie-category">
          <div class="cookie-category-header">
            <h4 class="cookie-category-title">${value.name}</h4>
            <label class="cookie-switch">
              <input type="checkbox" id="cookie-${key}" ${value.required ? 'disabled checked' : ''}>
              <span class="cookie-slider"></span>
            </label>
          </div>
          <p class="cookie-category-desc">${value.desc}</p>
        </div>
      `;
    }
    
    modal.innerHTML = `
      <div class="cookie-modal-content">
        <div class="cookie-modal-header">
          <h3 class="cookie-modal-title">การตั้งค่าคุกกี้</h3>
          <button class="cookie-modal-close">&times;</button>
        </div>
        <div class="cookie-modal-body">
          <p>คุณสามารถเลือกประเภทของคุกกี้ที่คุณต้องการให้เราจัดเก็บ คุกกี้จำเป็นจะถูกจัดเก็บเสมอเพื่อให้เว็บไซต์ทำงานได้อย่างถูกต้อง</p>
          <div class="cookie-categories">
            ${categoriesHTML}
          </div>
        </div>
        <div class="cookie-modal-footer">
          <button class="cookie-save-btn">บันทึกการตั้งค่า</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  }

  // ตั้งค่าคุกกี้ตามที่ผู้ใช้เลือก
  function setCookies(settings) {
    // จัดเก็บการตั้งค่าของผู้ใช้
    const consentDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);
    
    const cookieValue = {
      consent: true,
      timestamp: consentDate.toISOString(),
      expires: expiryDate.toISOString(),
      settings: settings
    };
    
    document.cookie = `tanyarat_cookie_consent=${JSON.stringify(cookieValue)};expires=${expiryDate.toUTCString()};path=/;SameSite=Lax`;
    
    // ถ้าต้องการทำอะไรเพิ่มเติมกับแต่ละประเภทของคุกกี้ สามารถทำได้ที่นี่
    if (settings.analytics) {
      // เปิดใช้งาน Analytics
      enableAnalytics();
    }
    
    if (settings.marketing) {
      // เปิดใช้งาน Marketing
      enableMarketing();
    }
  }

  // อ่านการตั้งค่าคุกกี้จากที่เคยบันทึกไว้
  function getCookieConsent() {
    const cookieConsent = document.cookie
      .split('; ')
      .find(row => row.startsWith('tanyarat_cookie_consent='));
    
    if (cookieConsent) {
      try {
        const consentValue = JSON.parse(cookieConsent.split('=')[1]);
        return consentValue;
      } catch (e) {
        // กรณีที่ไม่สามารถแปลงค่าเป็น JSON ได้
        return null;
      }
    }
    
    return null;
  }

  // เปิดใช้งาน Analytics (ตัวอย่าง)
  function enableAnalytics() {
    // ในกรณีที่ใช้ GA หรือ analytics อื่นๆ
    if (typeof gtag === 'function') {
      // เปิดใช้งาน GA
    }
  }

  // เปิดใช้งาน Marketing (ตัวอย่าง)
  function enableMarketing() {
    // ในกรณีที่ใช้ Facebook Pixel หรือ marketing tools อื่นๆ
  }

  // ตรวจสอบและแสดง Banner ถ้าจำเป็น
  function checkAndShowBanner() {
    const consent = getCookieConsent();
    
    if (!consent) {
      // แน่ใจว่ามีการแสดง Banner
      setTimeout(() => {
        if (consentBanner) {
          consentBanner.classList.remove('hidden');
        }
      }, 1000);
    } else {
      // ถ้าเคยให้ consent แล้ว ก็ใช้การตั้งค่าที่บันทึกไว้
      if (settingsToggle) {
        settingsToggle.classList.add('visible');
      }
      
      // นำการตั้งค่าไปใช้
      if (consent.settings.analytics) {
        enableAnalytics();
      }
      
      if (consent.settings.marketing) {
        enableMarketing();
      }
    }
  }

  // Event Handlers
  function setupEventListeners() {
    // Accept All Cookies
    consentBanner.querySelector('.cookie-accept-btn').addEventListener('click', () => {
      // ยอมรับทุกประเภทของคุกกี้
      const settings = {
        necessary: true,
        functional: true,
        analytics: true,
        marketing: true
      };
      
      setCookies(settings);
      consentBanner.classList.add('hidden');
      settingsToggle.classList.add('visible');
    });
    
    // Open Settings Modal
    consentBanner.querySelector('.cookie-settings-btn').addEventListener('click', () => {
      openSettingsModal();
    });
    
    // Settings Toggle
    settingsToggle.addEventListener('click', () => {
      openSettingsModal();
    });
    
    // Close Modal
    settingsModal.querySelector('.cookie-modal-close').addEventListener('click', () => {
      settingsModal.classList.remove('show');
    });
    
    // Save Settings
    settingsModal.querySelector('.cookie-save-btn').addEventListener('click', () => {
      saveSettings();
      settingsModal.classList.remove('show');
      consentBanner.classList.add('hidden');
      settingsToggle.classList.add('visible');
    });
    
    // เมื่อคลิกพื้นหลังของ Modal ให้ปิด
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        settingsModal.classList.remove('show');
      }
    });
  }

  // เปิด Modal การตั้งค่า
  function openSettingsModal() {
    if (settingsModal) {
      // อัพเดทสถานะปัจจุบันของ checkboxes ตามค่า consent ที่บันทึกไว้
      const consent = getCookieConsent();
      
      if (consent && consent.settings) {
        for (const [key, value] of Object.entries(consent.settings)) {
          const checkbox = document.getElementById(`cookie-${key}`);
          if (checkbox && !checkbox.disabled) {
            checkbox.checked = value;
          }
        }
      } else {
        // ถ้ายังไม่มี consent ให้ใช้ค่า default
        for (const [key, config] of Object.entries(cookieConfig)) {
          const checkbox = document.getElementById(`cookie-${key}`);
          if (checkbox && !checkbox.disabled) {
            checkbox.checked = config.default;
          }
        }
      }
      
      settingsModal.classList.add('show');
    }
  }

  // บันทึกการตั้งค่า
  function saveSettings() {
    const settings = {};
    
    for (const key of Object.keys(cookieConfig)) {
      const checkbox = document.getElementById(`cookie-${key}`);
      settings[key] = cookieConfig[key].required || (checkbox && checkbox.checked);
    }
    
    setCookies(settings);
  }

  // ตรวจสอบว่าเคยโหลด Cookie Banner มาแล้วหรือยัง
  function checkIfAlreadyLoaded() {
    return document.getElementById('cookie-consent-banner') !== null;
  }

  // เริ่มต้นระบบคุกกี้
  function init() {
    // ตรวจสอบว่าเคยโหลดแล้วหรือยัง
    if (checkIfAlreadyLoaded()) {
      return;
    }
    
    // สร้าง Elements
    consentBanner = createConsentBanner();
    settingsModal = createSettingsModal();
    settingsToggle = createSettingsToggle();
    
    // ตั้งค่า Event Listeners
    setupEventListeners();
    
    // ตรวจสอบและแสดง Banner ถ้าจำเป็น
    checkAndShowBanner();
  }

  // เริ่มต้นหลังจากโหลดหน้า
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // ให้สามารถเข้าถึงจากภายนอกได้ (ถ้าจำเป็น)
  window.tanyaratCookies = {
    openSettings: function() {
      if (settingsModal) {
        openSettingsModal();
      } else {
        // ถ้ายังไม่ได้สร้าง elements
        init();
        setTimeout(openSettingsModal, 100);
      }
    }
  };
})(); 