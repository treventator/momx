// Common.js - Shared functionality across all pages

// Load cookie consent
document.addEventListener('DOMContentLoaded', function () {
  // Update navbar auth state
  updateNavbarAuthState();

  // Set up footer functionality
  setupFooterFunctionality();
});
/**
 * Get cookie value by name
 */
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

/**
 * Update navbar to show login or account button based on auth state
 */
async function updateNavbarAuthState() {
  // Try localStorage first, then cookie
  let token = localStorage.getItem('token') || localStorage.getItem('liff_token') || getCookie('token');
  const userData = localStorage.getItem('user') || localStorage.getItem('liff_user');

  // Get navbar elements
  const navLoginBtn = document.getElementById('navLoginBtn');
  const navAccountBtn = document.getElementById('navAccountBtn');
  const navAccountName = document.getElementById('navAccountName');

  // If we have token but no user data (Safari Private Mode), try to get from API
  if (token && !userData) {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // Update navbar
          if (navLoginBtn) navLoginBtn.classList.add('d-none');
          if (navAccountBtn) navAccountBtn.classList.remove('d-none');

          if (navAccountName) {
            const displayName = data.user.lineProfile?.displayName ||
              data.user.displayName ||
              data.user.firstName || 'บัญชี';
            navAccountName.textContent = displayName;
          }
          return;
        }
      }
    } catch (e) {
      console.log('Auth check via API failed');
    }
  }

  if (token && userData) {
    // User is logged in
    if (navLoginBtn) navLoginBtn.classList.add('d-none');
    if (navAccountBtn) navAccountBtn.classList.remove('d-none');

    // Update account name if available
    if (navAccountName) {
      try {
        const user = JSON.parse(userData);
        navAccountName.textContent = user.displayName || user.firstName || 'บัญชี';
      } catch (e) {
        navAccountName.textContent = 'บัญชี';
      }
    }
  } else {
    // User is not logged in
    if (navLoginBtn) navLoginBtn.classList.remove('d-none');
    if (navAccountBtn) navAccountBtn.classList.add('d-none');
  }

  // Setup logout button handler
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      handleLogout();
    });
  }
}

/**
 * Handle user logout
 */
function handleLogout() {
  // Clear all auth tokens
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('liff_token');
  localStorage.removeItem('user');
  localStorage.removeItem('liff_user');

  // Clear auth cookie
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

  // Redirect to home page
  window.location.href = '/index.html';
}

// Setup footer functionality
function setupFooterFunctionality() {
  // Newsletter signup form
  const newsletterForm = document.querySelector('footer form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const emailInput = this.querySelector('input[type="email"]');
      if (emailInput && emailInput.value.trim() !== '') {
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'alert alert-success mt-2';
        successMessage.textContent = 'ขอบคุณที่ลงทะเบียนรับข่าวสาร!';

        // Clear the input
        emailInput.value = '';

        // Add the message
        if (this.querySelector('.alert')) {
          this.querySelector('.alert').remove();
        }
        this.appendChild(successMessage);

        // Remove the message after 3 seconds
        setTimeout(() => {
          if (successMessage.parentNode) {
            successMessage.remove();
          }
        }, 3000);
      }
    });
  }
}

// Create and append privacy banner
function createPrivacyBanner() {
  // Check if we already have consent
  const hasConsent = document.cookie
    .split('; ')
    .find(row => row.startsWith('tanyarat_cookie_consent='));

  if (hasConsent) {
    return; // Don't show banner if consent already given
  }

  // Create banner element
  const banner = document.createElement('div');
  banner.className = 'privacy-banner';
  banner.id = 'privacy-banner';
  banner.innerHTML = `
    <p class="privacy-banner-text">เว็บไซต์นี้ใช้คุกกี้เพื่อพัฒนาประสบการณ์การใช้งานของคุณ</p>
    <div class="privacy-banner-buttons">
      <button class="privacy-banner-btn privacy-accept-btn">ยอมรับทั้งหมด</button>
      <button class="privacy-banner-btn privacy-settings-btn">ตั้งค่าคุกกี้</button>
    </div>
  `;

  // Insert at the end of the body
  document.body.appendChild(banner);

  // Ensure it's visible
  setTimeout(() => {
    banner.style.display = 'flex';
  }, 1000);

  // Add event listeners
  banner.querySelector('.privacy-accept-btn').addEventListener('click', function () {
    // Accept all cookies
    acceptAllCookies();
    banner.classList.add('hidden');
  });

  banner.querySelector('.privacy-settings-btn').addEventListener('click', function () {
    // Open cookie settings modal when it's available
    if (window.tanyaratCookies && window.tanyaratCookies.openSettings) {
      window.tanyaratCookies.openSettings();
    } else {
      // If cookie settings not loaded yet, try again after a short delay
      setTimeout(function () {
        if (window.tanyaratCookies && window.tanyaratCookies.openSettings) {
          window.tanyaratCookies.openSettings();
        }
      }, 500);
    }
    banner.classList.add('hidden');
  });
}

// Function to accept all cookies
function acceptAllCookies() {
  const consentDate = new Date();
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 365); // 1 year

  const cookieValue = {
    consent: true,
    timestamp: consentDate.toISOString(),
    expires: expiryDate.toISOString(),
    settings: {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    }
  };

  document.cookie = `tanyarat_cookie_consent=${JSON.stringify(cookieValue)};expires=${expiryDate.toUTCString()};path=/;SameSite=Lax`;

  // Example cookie functionality implementations
  enableGoogleAnalytics();
  enableFacebookPixel();
  saveUserPreferences();
}

// Example functions to show how cookies would be implemented
function enableGoogleAnalytics() {
  // This is where you would actually implement Google Analytics
  console.log('Google Analytics enabled');

  // Example code (commented out as it's just for demonstration)
  // window.dataLayer = window.dataLayer || [];
  // function gtag(){dataLayer.push(arguments);}
  // gtag('js', new Date());
  // gtag('config', 'UA-XXXXXXXX-X');
}

function enableFacebookPixel() {
  // This is where you would actually implement Facebook Pixel
  console.log('Facebook Pixel enabled');

  // Example code (commented out as it's just for demonstration)
  // !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  // n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  // n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  // t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  // document,'script','https://connect.facebook.net/en_US/fbevents.js');
  // fbq('init', 'XXXXXXXXXXXXXXXXX');
  // fbq('track', 'PageView');
}

function saveUserPreferences() {
  // This would save user preferences like dark mode, language, etc.
  console.log('User preferences saved');

  // Example implementation
  const userPrefs = {
    theme: 'light',
    fontSize: 'medium',
    language: 'th'
  };

  localStorage.setItem('userPreferences', JSON.stringify(userPrefs));
} 